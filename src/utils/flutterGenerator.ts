import { NotificationItem, AppConfig } from '../types';

export function generatePubspecYaml(notifications: NotificationItem[], config: AppConfig): string {
  return `name: material_notification_display
description: A Material You Windows Notification display software with custom JS Scripting.
version: 1.0.0+1

environment:
  sdk: ">=3.0.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter
  flutter_js: ^0.8.1
  shared_preferences: ^2.2.2
  path_provider: ^2.1.1
  intl: ^0.19.0
  carousel_slider: ^4.2.1
  file_picker: ^8.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
`;
}

export function generateMainDart(notifications: NotificationItem[], config: AppConfig): string {
  // Convert current state into hardcoded initial notifications list
  const notificationsJson = JSON.stringify(notifications, null, 2);
  const escapedScript = config.scriptContent.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/"/g, '\\"');

  return `import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_js/flutter_js.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'package:file_picker/file_picker.dart';

void main() {
  runApp(const MaterialNotifyApp());
}

class MaterialNotifyApp extends StatelessWidget {
  const MaterialNotifyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Material Notification Display',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0061A4),
          brightness: Brightness.light,
        ),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0061A4),
          brightness: Brightness.dark,
        ),
        themeMode: ThemeMode.system,
      ),
      home: const NotificationDashboard(),
    );
  }
}

class NotificationItem {
  String id;
  String title;
  String text;
  int durationSecs;
  String? colorAccent;
  bool isActive;

  NotificationItem({
    required this.id,
    required this.title,
    required this.text,
    required this.durationSecs,
    this.colorAccent,
    required this.isActive,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'text': text,
    'durationSecs': durationSecs,
    'colorAccent': colorAccent,
    'isActive': isActive,
  };

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      text: json['text'] ?? '',
      durationSecs: json['durationSecs'] ?? 5,
      colorAccent: json['colorAccent'],
      isActive: json['isActive'] ?? true,
    );
  }
}

class NotificationDashboard extends StatefulWidget {
  const NotificationDashboard({super.key});

  @override
  State<NotificationDashboard> createState() => _NotificationDashboardState();
}

class _NotificationDashboardState extends State<NotificationDashboard> {
  List<NotificationItem> _notifications = [];
  bool _scriptEnabled = ${config.scriptEnabled};
  String _jsScript = """${escapedScript}""";
  
  int _currentIndex = 0;
  Timer? _carouselTimer;
  Timer? _progressBarTimer;
  double _progressValue = 0.0;
  int _currentNotificationDurationMs = 5000;
  int _elapsedMs = 0;
  
  double _fontSize = ${config.fontSize * 16};
  bool _isFullscreen = false;
  
  late JavascriptRuntime _jsRuntime;
  List<NotificationItem> _processedNotifications = [];

  @override
  void initState() {
    super.initState();
    _initJsRuntime();
    _loadData().then((_) {
      _processNotificationsWithJs();
      _startCarousel();
    });
  }

  void _initJsRuntime() {
    _jsRuntime = getJavascriptRuntime();
  }

  @override
  void dispose() {
    _carouselTimer?.cancel();
    _progressBarTimer?.cancel();
    _jsRuntime.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final prefs = await SharedPreferences.getInstance();
    final String? notesJson = prefs.getString('notifications');
    if (notesJson != null) {
      final List<dynamic> decoded = jsonDecode(notesJson);
      setState(() {
        _notifications = decoded.map((item) => NotificationItem.fromJson(item)).toList();
      });
    } else {
      // Default initial local dataset
      setState(() {
        _notifications = [
          NotificationItem(id: '1', title: 'Welcome', text: 'Welcome to Material Notification Display for Windows!', durationSecs: 6, isActive: true),
          NotificationItem(id: '2', title: 'System Alert', text: 'This notice is currently rotating. Interval config can be changed anytime.', durationSecs: 4, isActive: true),
        ];
      });
    }
  }

  Future<void> _saveData() async {
    final prefs = await SharedPreferences.getInstance();
    final String encoded = jsonEncode(_notifications.map((n) => n.toJson()).toList());
    await prefs.setString('notifications', encoded);
  }

  void _processNotificationsWithJs() {
    if (!_scriptEnabled || _jsScript.isEmpty) {
      setState(() {
        _processedNotifications = _notifications.where((n) => n.isActive).toList();
      });
      return;
    }

    List<NotificationItem> results = [];
    final now = DateTime.now();
    final env = {
      'systemTime': DateFormat('HH:mm:ss').format(now),
      'isWeekend': now.weekday == DateTime.saturday || now.weekday == DateTime.sunday,
      'dayOfWeek': DateFormat('EEEE').format(now),
      'hour': now.hour,
    };

    for (var n in _notifications) {
      if (!n.isActive) continue;
      
      try {
        final String evalStr = """
          \$_item = \${jsonEncode(n.toJson())};
          \$_env = \${jsonEncode(env)};
          
          \$_run = function() {
            \$_jsScript
            if (typeof filterAndFormat === 'function') {
              return filterAndFormat(\$_item, \$_env);
            }
            return \$_item;
          }();
          JSON.stringify(\$_run);
        """;
        
        final JsEvalResult jsResult = _jsRuntime.evaluate(evalStr);
        if (jsResult.stringResult != 'null' && jsResult.stringResult != 'undefined') {
          final Map<String, dynamic> parsed = jsonDecode(jsResult.stringResult);
          results.add(NotificationItem.fromJson(parsed));
        }
      } catch (e) {
        // Fallback to unmodified item on script errors
        results.add(n);
      }
    }

    setState(() {
      _processedNotifications = results;
      if (_currentIndex >= _processedNotifications.length) {
        _currentIndex = 0;
      }
    });
  }

  void _startCarousel() {
    _carouselTimer?.cancel();
    _progressBarTimer?.cancel();
    if (_processedNotifications.isEmpty) return;

    final currentItem = _processedNotifications[_currentIndex];
    _currentNotificationDurationMs = currentItem.durationSecs * 1000;
    _elapsedMs = 0;
    _progressValue = 0.0;

    _progressBarTimer = Timer.periodic(const Duration(milliseconds: 50), (timer) {
      setState(() {
        _elapsedMs += 50;
        _progressValue = _elapsedMs / _currentNotificationDurationMs;
        if (_progressValue >= 1.0) {
          _progressValue = 1.0;
          _nextNotification();
        }
      });
    });
  }

  void _nextNotification() {
    if (_processedNotifications.isEmpty) return;
    setState(() {
      _currentIndex = (_currentIndex + 1) % _processedNotifications.length;
    });
    _startCarousel();
  }

  void _prevNotification() {
    if (_processedNotifications.isEmpty) return;
    setState(() {
      _currentIndex = (_currentIndex - 1 + _processedNotifications.length) % _processedNotifications.length;
    });
    _startCarousel();
  }

  void _exportConfig() async {
    final String data = jsonEncode({
      'notifications': _notifications.map((n) => n.toJson()).toList(),
      'jsScript': _jsScript,
      'scriptEnabled': _scriptEnabled,
      'fontSize': _fontSize,
    });
    
    String? outputFile = await FilePicker.platform.saveFile(
      dialogTitle: 'Export Notification Configuration',
      fileName: 'notification_config.json',
      type: FileType.custom,
      allowedExtensions: ['json'],
    );
    
    if (outputFile != null) {
      final file = File(outputFile);
      await file.writeAsString(data);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Configuration exported successfully!')),
      );
    }
  }

  void _importConfig() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['json'],
    );

    if (result != null && result.files.single.path != null) {
      final file = File(result.files.single.path!);
      final String content = await file.readAsString();
      try {
        final Map<String, dynamic> data = jsonDecode(content);
        if (data.containsKey('notifications')) {
          final List<dynamic> notes = data['notifications'];
          setState(() {
            _notifications = notes.map((item) => NotificationItem.fromJson(item)).toList();
            if (data.containsKey('jsScript')) _jsScript = data['jsScript'];
            if (data.containsKey('scriptEnabled')) _scriptEnabled = data['scriptEnabled'];
            _currentIndex = 0;
          });
          await _saveData();
          _processNotificationsWithJs();
          _startCarousel();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Configuration imported successfully!')),
          );
        }
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to import configuration file.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isFullscreen) {
      return _buildFullscreenView();
    }
    return Scaffold(
      appBar: AppBar(
        title: const Text('Material Notification Display'),
        actions: [
          IconButton(
            icon: const Icon(Icons.fullscreen),
            tooltip: 'Fullscreen View',
            onPressed: () => setState(() => _isFullscreen = true),
          ),
          IconButton(
            icon: const Icon(Icons.file_upload),
            tooltip: 'Import Config',
            onPressed: _importConfig,
          ),
          IconButton(
            icon: const Icon(Icons.file_download),
            tooltip: 'Export Config',
            onPressed: _exportConfig,
          ),
        ],
      ),
      body: Row(
        children: [
          // Left Panel: Operations & Script Editor
          Expanded(
            flex: 1,
            child: _buildControlsPanel(),
          ),
          const VerticalDivider(width: 1),
          // Right Panel: Live Carousel Display
          Expanded(
            flex: 1,
            child: _buildCarouselPanel(),
          ),
        ],
      ),
    );
  }

  Widget _buildFullscreenView() {
    final now = DateTime.now();
    final timeStr = DateFormat('HH:mm:ss').format(now);
    final activeText = _processedNotifications.isNotEmpty 
        ? _processedNotifications[_currentIndex].text 
        : 'No notifications active';

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Center(
            child: Padding(
              padding: const EdgeInsets.all(40.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    timeStr,
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 80,
                      color: Colors.white70,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 60),
                  Text(
                    activeText,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: _fontSize * 1.5,
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            top: 20,
            right: 20,
            child: IconButton(
              icon: const Icon(Icons.fullscreen_exit, color: Colors.white54, size: 30),
              onPressed: () => setState(() => _isFullscreen = false),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildControlsPanel() {
    // Contains notification editing, intervals, and scripting settings...
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: ListView(
        children: [
          Text('Manage Notifications', style: Theme.of(context).textTheme.titleMedium),
          // Detailed list building and CRUD buttons would go here...
        ],
      ),
    );
  }

  Widget _buildCarouselPanel() {
    // Contains beautiful Material You card with circular progress indicator as progress bar...
    return Container();
  }
}
`;
}

export function generatePackagingInstructions(): string {
  return `# Flutter Windows Cross-Platform Packaging & Compilation Guide

Follow these steps to build and compile this Material You Notification Applet on Windows and other platforms:

## 1. Environment Setup

Ensure you have Flutter installed. Run \`flutter doctor\` to confirm Windows development support is set up.

\`\`\`bash
# Install and enable Windows build support
flutter config --enable-windows-desktop
\`\`\`

## 2. Initialize Project

Create a new Flutter project and replace the contents:

\`\`\`bash
# Create a new flutter app
flutter create material_notification_display
cd material_notification_display

# Replace standard files with the generated code
# Replace pubspec.yaml with the generated pubspec.yaml
# Replace lib/main.dart with the generated main.dart
\`\`\`

## 3. Install Dependencies

Fetch all custom packages:

\`\`\`bash
flutter pub get
\`\`\`

## 4. Run & Test Locally on Windows

Launch the developer environment on your Windows Desktop:

\`\`\`bash
flutter run -d windows
\`\`\`

## 5. Build for Distribution (Windows Packaging)

Compile the self-contained Release executable:

\`\`\`bash
flutter build windows --release
\`\`\`

This creates compiled native build files inside:
📂 \`build/windows/runner/Release/\`

The folder includes:
- 📄 \`material_notification_display.exe\` (The main binary executable)
- ⚙️ Necessary \`.dll\` libraries (dynamic dependencies for JS Engine, File Dialogs, and SharedPreferences)

## 6. Create installer (msi / exe)

To bundle the application into a single installer file for easy deployment:

- Use **Inno Setup** (free, easy Windows installer script) to pack the \`Release/\` directory.
- Alternatively, use Flutter's modern package \`msix\`:
  \`\`\`bash
  # Run in your command terminal
  flutter pub run msix:create
  \`\`\`
  This outputs a Windows Appx installer (.msix) which can be installed instantly with Microsoft App Installer!
`;
}

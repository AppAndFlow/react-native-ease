Pod::Spec.new do |s|
  s.name           = 'FrameMetrics'
  s.version        = '1.0.0'
  s.summary        = 'Frame metrics collection module'
  s.description    = 'Expo module for collecting frame timing metrics'
  s.license        = 'MIT'
  s.author         = 'Janic Duplessis'
  s.homepage       = 'https://github.com/AppAndFlow/react-native-ease'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/AppAndFlow/react-native-ease.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.{h,m,swift}"

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end

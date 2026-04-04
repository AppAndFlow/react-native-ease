require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "Ease"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  # Fabric autolinking registers this component for Apple TV targets too.
  # If the podspec only declares :ios, tvOS apps still get the registration
  # entry but not the native class, which crashes provider initialization.
  s.platforms    = { :ios => min_ios_version_supported, :tvos => min_ios_version_supported }
  s.source       = { :git => "https://github.com/janicduplessis/react-native-ease.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.private_header_files = "ios/**/*.h"

  install_modules_dependencies(s)
end

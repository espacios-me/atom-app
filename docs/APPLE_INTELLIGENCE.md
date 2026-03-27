# iOS 26 Apple Intelligence Integration

This document outlines the integration of Apple's Foundation Models into the Atom mobile app for iOS 26 and later.

## Requirements
- **iOS 26** or later
- **Apple Intelligence** enabled (Settings > Apple Intelligence & Siri)
- **Xcode 26** or later

## Core Integration Logic

The following Swift code enables on-device AI for personalized suggestions and habit tracking.

```swift
import FoundationModels

class AIHelper {
    private var session: LanguageModelSession?
    private var transcript: Transcript?  // Save this to UserDefaults or Core Data

    func start() async {
        guard let model = SystemLanguageModel.default, model.isAvailable else { return }
        if let saved = loadTranscript() {  // your save func
            session = LanguageModelSession(transcript: saved)
        } else {
            session = LanguageModelSession()
        }
    }

    func suggestNext(after action: String) async -> String? {
        guard let session else { return nil }
        let prompt = "User just did: \(action). Based on their habits, suggest the next logical step or auto-fill action."
        
        do {
            let response = try await session.generate(prompt)
            return response.text
        } catch {
            print("AI Error: \(error)")
            return nil
        }
    }
    
    // Helper to load transcript from storage
    private func loadTranscript() -> Transcript? {
        // Implementation for loading from UserDefaults or Core Data
        return nil
    }
}
```

## Usage in Atom App
This logic should be bridged to the React Native layer using a Native Module to allow the Expo app to trigger AI-powered suggestions based on user interactions.

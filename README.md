# Mobile Dash-Cam App

**Mobile Dash-Cam app built using React Native with Expo.**

## Project Overview

The Mobile Dash-Cam app is designed to provide users with a reliable and efficient way to record their journeys using their mobile devices. The app will utilise both front and back-facing cameras to capture video footage, which can be invaluable for insurance claims and law enforcement investigations. The development of this app will follow the Agile methodology, organised into three iterations (sprints).

## Project Plan

### Agile Methodology

The development process will be divided into three sprints:

#### Sprint 1: Core Features
- Implement core recording functionality using both front and back-facing cameras.
- Establish a SQLite database to store references to each recording.
- Create queries to automatically delete old footage.

#### Sprint 2: Storage Management and UI
- Implement storage management features, including compression and encryption.
- Begin development of the user interface (UI).
- Calculate vehicular speed for display in Sprint 3.
- Allow users to download and export data.

#### Sprint 3: Final UI and Miscellaneous Features
- Complete the UI implementation.
- Add support for portrait recordings.
- Include metadata for each recording and SQL queries for sorting recordings by various criteria.

## Features and Limitations

### Recording
- **Feature**: Record video footage through both front and back-facing cameras.
- **Benefit**: Provides video evidence for insurance claims and law enforcement investigations.
- **Limitations**: Does not support auto-adjusting resolution based on storage capacity due to resource constraints.

### Storage
- **Feature**: Manage recorded footage with automatic deletion of old files unless flagged by the user.
- **Benefit**: Ensures efficient storage management and accessibility of footage.
- **Limitations**: No support for cloud storage due to development time and privacy concerns.

### Compression
- **Feature**: Reduce file size of recorded footage to manage storage space.
- **Benefit**: Allows users to store more footage.
- **Limitations**: Does not support auto-adjusting compression rates based on available storage.

### Sensors
- **Feature**: Provide vehicular speed data during recordings.
- **Benefit**: Valuable for insurance claims and law enforcement analysis.
- **Limitations**: No support for Advanced Driver Assistance Systems (ADAS) or crash detection due to resource intensity.

### Download/Export
- **Feature**: Allow users to save and share footage outside the app.
- **Benefit**: Facilitates easy sharing with insurance companies and law enforcement.
- **Limitations**: Does not support in-app sharing between users due to the need for an account system.

### Intuitive UI
- **Feature**: User-friendly interface for easy interaction with the app.
- **Benefit**: Ensures all stakeholders can effectively use the app.
- **Limitations**: No options for language changes or custom UI due to complexity.

### Encryption
- **Feature**: Protect recorded footage with symmetric encryption (AES algorithm).
- **Benefit**: Adds a layer of security for sensitive footage.
- **Limitations**: Does not support asymmetric encryption (e.g., RSA) due to development priorities.

### Sat-Nav
- **Feature**: Navigation system integrated into the app.
- **Limitations**: Not implemented due to the complexity and availability of existing solutions like Google Maps and Waze.

## Conclusion

The Mobile Dash-Cam app aims to provide essential features for recording and managing video footage while ensuring user-friendliness and security. The outlined features and limitations reflect a focused approach to development, prioritising core functionalities that meet the needs of stakeholders.

## Getting Started

To get started with the Mobile Dash-Cam app, clone the repository and follow the installation instructions in the [Installation Guide](link-to-installation-guide).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


# Smart Agriculture Monitoring System

A powerful web-based platform for precision agriculture, combining real-time monitoring, AI-driven insights, and digital twin simulation. This tool empowers farmers and agronomists to make data-driven decisions for optimal crop health and yield.

![Dashboard Preview](images/screenshot_01.jpeg)

## Features

### 🌾 Smart Field Monitoring
- Real-time tracking of critical soil parameters (Nitrogen, Phosphorus, Potassium, pH)
- Live environmental monitoring (Temperature, Humidity, Moisture)
- **NDVI Visualization**: Color-coded field health mapping (Healthy, Moderate, Critical)
- Interactive Grid-based Field View for granular management

![Field View](images/screenshot_02.jpeg)

### 🤖 Intelligent Recommendations
- **Crop Recommendation Engine**: ML-based suggestions for optimal crops based on soil and weather data
- **Disease Detection**: Image analysis for early identification of plant diseases
- **Smart Remediation**: Automated suggestions for correcting warnings (e.g., "Water Field", "Add Fertilizer")

![Recommendation System](images/screenshot_03.jpeg)

### 📊 Advanced Analytics & Profiling
- Comprehensive farm health assessment
- Historical trend analysis for soil quality and crop growth
- Aggregated metrics for easy decision making (Avg NDVI, Yield Predictions)
- Interactive charts and visualizations for temporal data

![Disease Risk Analysis](images/screenshot_04.jpeg)

### ⚠️ Real-time Alert System
- Instant notifications for critical threshold breaches (e.g., Low Moisture, Low Nitrogen)
- Server-Sent Events (SSE) for low-latency updates
- Severity processing (Critical, Warning, Information)
- Actionable alerts with one-click fix capabilities

![Alerts Panel](images/screenshot_02.jpeg)

### 🚜 Digital Twin Simulation
- **Dynamic Field Simulation**: Simulates changing field conditions over time
- **Interactive Control**: Adjust simulation speed and event frequency
- **Scenario Testing**: Test how fields react to different environmental changes

## 🏗️ System Architecture
![System Architecture](images/screenshot_05.jpeg)

## 📐 Design Diagrams
| Sequence Diagram | Class Diagram |
|:---:|:---:|
| ![Sequence Diagram](images/screenshot_06.jpeg) | ![Class Diagram](images/screenshot_07.jpeg) |

| Use Case Diagram | Data Flow (L0) |
|:---:|:---:|
| ![Use Case Diagram](images/screenshot_08.jpeg) | ![DFD L0](images/screenshot_09.jpeg) |

| Data Flow (L1) | |
|:---:|:---:|
| ![DFD L1](images/screenshot_10.jpeg) | |

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Recharts
- **Backend**: Spring Boot (Java), JPA/Hibernate
- **Machine Learning**: ML.NET (C#), Python (FastAPI)
- **Database**: MySQL / H2
- **Communication**: REST APIs, Server-Sent Events

This platform is designed to modernize farming practices by providing intuitive, actionable insights accessible to everyone from independent farmers to large-scale agricultural enterprises.
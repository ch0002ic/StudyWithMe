# StudyWithMe

An adaptive AI-powered learning platform that provides personalized, accessible, and engaging learning experiences for users of all ages and abilities.

## �� Features

- **AI-Powered Tutoring**
  - Conversational and adaptive learning
  - Personalized content based on user profile
  - Interactive chat interface

- **Personalized Learning**
  - Multiple age groups (child, teen, adult, senior)
  - Various subjects (math, language, science)
  - Adjustable difficulty levels
  - Customizable learning experience

- **Accessibility Features**
  - High contrast mode
  - Large text options
  - Voice interaction
  - Universal design principles

- **Gamification Elements**
  - XP (experience points) system
  - Achievement tracking
  - Streak system
  - Progress visualization
  - Interactive quizzes

- **Student Dashboard**
  - Learning statistics
  - Achievement tracking
  - Recent activity feed
  - Progress monitoring

## 🚀 Getting Started

### Prerequisites

- Python 3.11 or higher
- Node.js and npm
- OpenAI API key (purchase is required for API access, so we use Hugging Face for now for demo purposes)

### Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd StudyWithMe
```

2. Set up the backend:
```bash
cd backend
# Create and activate virtual environment (optional but recommended)
python -m venv venv
# On Windows
.\venv\Scripts\activate
# On Unix or MacOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file in the backend directory (purchase is required for API access, so we use Hugging Face for now for demo purposes)
echo "OPENAI_API_KEY=your_api_key_here" > .env
```

3. Set up the frontend:
```bash
cd frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
uvicorn main:app --reload --port 8000
```

2. In a new terminal, start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## 🛠️ Tech Stack

- **Frontend**
  - React with TypeScript
  - Vite
  - Framer Motion for animations
  - React Icons
  - Local Storage for data persistence

- **Backend**
  - FastAPI
  - OpenAI API (purchase is required for API access, so we use Hugging Face for now for demo purposes)
  - Python 3.11
  - Uvicorn server

## 📱 Progressive Web App

The application is built as a Progressive Web App (PWA), allowing users to:
- Install it on their devices
- Use it offline
- Receive updates automatically

## 🔒 Environment Variables

Create a `.env` file in the backend directory with the following (purchase is required for API access, so we use Hugging Face for now for demo purposes):
```env
OPENAI_API_KEY=your_api_key_here
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for providing the AI capabilities
- The open-source community for the amazing tools and libraries
- All contributors who help improve the project

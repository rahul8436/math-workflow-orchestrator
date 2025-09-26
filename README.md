# 🧮 Mathematical Workflow Orchestrator

An intelligent AI-powered platform for building, visualizing, and executing mathematical workflows with natural language interaction.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![React Flow](https://img.shields.io/badge/React%20Flow-11.0-red.svg)

## ✨ Features

### 🤖 **AI-Powered Workflow Creation**
- **Natural Language Processing** - "Create workflow for 4 + 5 divided by 3"
- **Smart Intent Detection** - Find, create, execute, or explain workflows
- **Multi-Model AI Orchestration** - Uses multiple AI models with automatic fallback
- **Expression Parsing** - Converts natural language to mathematical expressions

### 🎯 **Visual Workflow Builder**
- **Interactive Node Editor** - Drag & drop mathematical operations
- **Real-time Visualization** - See your calculations as connected nodes
- **Smart Positioning** - Automatic layout prevents node overlapping
- **Responsive Design** - Works on desktop and mobile devices

### 💡 **Intelligent Workflow Management**
- **Template System** - Save and reuse common calculations
- **Workflow Search** - Find existing workflows by description
- **Auto-Loading** - High-confidence matches load automatically
- **Usage Analytics** - Track popular workflows and patterns

### 🔧 **Advanced Features**
- **Live Execution** - Calculate results in real-time
- **Multiple Operations** - Addition, subtraction, multiplication, division, and more
- **Variable Support** - Use variables (x, y, z) in expressions
- **Export/Import** - Save workflows as JSON files

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Groq API Key** - [Get free API key](https://console.groq.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/math-workflow.git
   cd math-workflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```bash
   # Required: Groq API Key for AI functionality
   GROQ_API_KEY=your_groq_api_key_here
   ```

   **🔑 How to get your Groq API Key:**
   - Visit [console.groq.com](https://console.groq.com/)
   - Sign up for a free account
   - Go to API Keys section
   - Create a new API key
   - Copy the key to your `.env.local` file

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 Usage Guide

### Creating Workflows

#### **Method 1: Natural Language (Recommended)**
Simply chat with the AI assistant:

```
"Create workflow for adding 4 and 7"
"I need x + y - z divided by 2" 
"Build a percentage calculator"
```

#### **Method 2: Visual Builder**
- Select from pre-built templates
- Drag nodes to create custom flows  
- Connect operands to operators

### Finding Workflows

```
"Find workflow where 3 is getting added with 5"
"Show me multiplication workflows"
"What workflows do I have for division?"
```

### Executing Workflows

```
"Calculate 10 + 15 - 8"
"Execute workflow with x=5, y=3"
```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/chat/          # AI chat API endpoint
│   └── page.tsx           # Main application page
├── components/
│   ├── WorkflowBuilder/   # Visual workflow editor
│   │   ├── nodes/         # Node components (operand, operator, result)
│   │   └── WorkflowControls.tsx
│   ├── Chatbot/           # AI chat interface
│   └── ui/                # Reusable UI components
├── lib/
│   ├── ai-orchestrator.ts # Multi-model AI coordination
│   ├── ai-models.ts       # AI model configuration & fallbacks
│   ├── workflow-matcher.ts # Pattern matching for workflows  
│   ├── expression-parser.ts # Mathematical expression parsing
│   └── workflow-executor.ts # Workflow execution engine
├── stores/
│   └── workflow-store.ts  # Zustand state management
├── types/
│   └── workflow.ts        # TypeScript type definitions
└── data/
    └── workflow-templates.ts # Pre-built workflow templates
```

## 🤖 AI Models & Rate Limits

The application uses **Groq's free tier** with intelligent fallback:

### **Model Fallback Chain**
1. **llama-3.3-70b-versatile** (Primary - Best quality)
2. **llama-3.1-70b-versatile** (Secondary)  
3. **mixtral-8x7b-32768** (Medium - Balanced)
4. **llama-3.1-8b-instant** (Fast)
5. **gemma2-9b-it** (Reliable fallback)
6. **gemma-7b-it** (Emergency fallback)

### **Handling Rate Limits**
- ✅ **Automatic Fallback** - Switches models when rate limited
- ✅ **6 Model Chain** - Multiple backup options
- ✅ **Smart Retry Logic** - Graceful error handling
- ✅ **Local Fallbacks** - Manual processing when all models fail

**Free Tier Limits:** 100,000 tokens/day per model

## 🛠️ Development

### **Tech Stack**
- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **UI:** React + Tailwind CSS
- **Visualization:** React Flow
- **State:** Zustand
- **AI:** Groq API with multiple models
- **Parsing:** Custom expression parser

### **Available Scripts**

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### **Environment Variables**

```bash
# .env.local
GROQ_API_KEY=gsk_...              # Required: Groq API key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Optional: App URL
NODE_ENV=development              # Optional: Environment
```

## 🧪 Testing

Try these examples after setup:

### **Basic Operations**
```
"Create workflow for 5 + 3"
"Build 10 * 2 / 4" 
"I need (7 + 8) * 3"
```

### **Complex Expressions**
```
"Create (x + y) * z where x=4, y=5, z=2"
"Build percentage: (part / whole) * 100"
"I need compound interest calculator"
```

### **Workflow Management**
```
"Find workflow for addition"
"Show me all my workflows"
"Execute workflow with different values"
```

## 🔧 Troubleshooting

### **Common Issues**

#### **1. Rate Limit Errors**
```bash
Error: 429 Rate limit reached
```
**Solution:** The app will automatically try fallback models. Wait a few minutes or upgrade to Groq Pro.

#### **2. Missing API Key**
```bash
Error: Invalid API key
```
**Solution:** Check your `.env.local` file has the correct `GROQ_API_KEY`.

#### **3. Node Overlapping**
**Solution:** The new version includes smart positioning - create a new workflow to see the fix.

#### **4. Templates Not Switching**
**Solution:** Updated sync logic fixes this - try clicking different templates.

## 📝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Issues:** [GitHub Issues](https://github.com/your-username/math-workflow/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-username/math-workflow/discussions)
- **Email:** your-email@example.com

## 🎯 Roadmap

- [ ] **Advanced Functions** - Trigonometry, logarithms, etc.
- [ ] **Multi-step Workflows** - Complex calculation sequences
- [ ] **Collaboration** - Share workflows with team members
- [ ] **API Integration** - Connect to external data sources
- [ ] **Mobile App** - Native iOS/Android applications

---

**Built with ❤️ using Next.js, React Flow, and Groq AI**

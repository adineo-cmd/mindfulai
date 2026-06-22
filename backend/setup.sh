#!/bin/bash

echo "🚀 Setting up MindfulAI Backend..."
echo "===================================="

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    OS="unknown"
fi

echo "📋 Detected OS: $OS"

# Install ONLY necessary system dependencies
# We removed WeasyPrint, so we don't need Cairo/Pango anymore!
# We use psycopg2-binary, so we don't need libpq-dev!
# We only need basic build tools just in case bcrypt needs to compile.

if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
    echo "📦 Installing basic build tools for Ubuntu/Debian..."
    sudo apt update
    sudo apt install -y build-essential python3-dev || { echo "❌ Failed to install system dependencies."; exit 1; }
    
elif [ "$OS" == "fedora" ] || [ "$OS" == "rhel" ] || [ "$OS" == "centos" ]; then
    echo "📦 Installing basic build tools for Fedora/RHEL..."
    sudo dnf install -y gcc python3-devel || { echo "❌ Failed to install system dependencies."; exit 1; }
    
elif [ "$OS" == "arch" ] || [ "$OS" == "manjaro" ]; then
    echo "📦 Installing basic build tools for Arch Linux..."
    sudo pacman -S --noconfirm base-devel || { echo "❌ Failed to install system dependencies."; exit 1; }
    
elif [ "$(uname)" == "Darwin" ]; then
    echo "📦 Checking build tools for macOS..."
    if ! command -v xcode-select &> /dev/null; then
        echo "⚠️  Xcode Command Line Tools not found. Installing..."
        xcode-select --install
    fi
    echo "✅ macOS build tools ready!"
else
    echo "⚠️  Unsupported OS: $OS"
    echo "   You may need to install basic build tools (gcc, python3-dev) manually."
fi

echo "✅ System dependencies installed!"
echo ""
echo "🐍 Setting up Python virtual environment..."

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "ℹ️  Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip -q

# Install Python dependencies
echo "📦 Installing Python dependencies (this may take a few minutes)..."
pip install -r requirements.txt || { echo "❌ Failed to install Python dependencies."; exit 1; }
echo "✅ Python dependencies installed!"

# Download ML models
echo ""
echo "🧠 Downloading AI models (this may take a few minutes)..."
python download_models.py || { echo "⚠️  Model download failed. You can run 'python download_models.py' manually later."; }

# Setup .env file
echo ""
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "⚙️  Created .env file from .env.example"
    else
        # Create a default .env if .env.example doesn't exist
        cat <<EOF > .env
DATABASE_URL=sqlite:///./mindfulai.db
SECRET_KEY=super-secret-key-change-in-prod
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=http://localhost:4321
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=tinyllama
EOF
        echo "⚙️  Created default .env file"
    fi
    echo "   ⚠️  Please update .env with your database credentials if using PostgreSQL!"
else
    echo "ℹ️  .env file already exists"
fi

echo ""
echo "===================================="
echo "✅ Setup complete!"
echo "===================================="
echo ""
echo "Next steps:"
echo "1. Activate virtual environment: source venv/bin/activate"
echo "2. (Optional) Update .env file with PostgreSQL credentials"
echo "3. Install and start Ollama (for open-source LLM):"
echo "   curl -fsSL https://ollama.com/install.sh | sh"
echo "   ollama pull tinyllama"
echo "   ollama serve"
echo "4. Start the server: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "📖 For more information, see README.md"
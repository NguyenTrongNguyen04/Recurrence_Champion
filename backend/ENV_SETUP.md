# Hướng dẫn cấu hình Environment Variables

## Biến `CEREBRAS_API_KEY` được lưu ở đâu?

`CEREBRAS_API_KEY` được lưu trong file `.env` trong thư mục `backend/`.

## Cách thiết lập

### Bước 1: Tạo file `.env`

Trong thư mục `backend/`, tạo file `.env` (copy từ `.env.example`):

```bash
cd backend
cp .env.example .env
```

Hoặc tạo file mới:

```bash
cd backend
touch .env
```

### Bước 2: Thêm API key vào file `.env`

Mở file `.env` và thêm:

```env
CEREBRAS_API_KEY=csk-ve6r9ehpy8knvt8yy6xmkr98jx4x6pt6f4xdftn3dedfmh6x
```

**Lưu ý**: 
- File `.env` đã được thêm vào `.gitignore` để không commit API key lên Git
- KHÔNG commit file `.env` lên repository công khai

### Bước 3: Load environment variables

File `config.py` đã tự động load file `.env` khi import:

```python
from dotenv import load_dotenv
load_dotenv()  # Load .env file
```

## Các cách khác để set environment variable

### 1. Environment Variable trong Terminal (Linux/Mac)

```bash
export CEREBRAS_API_KEY="csk-ve6r9ehpy8knvt8yy6xmkr98jx4x6pt6f4xdftn3dedfmh6x"
python api_server.py
```

### 2. Environment Variable trong PowerShell (Windows)

```powershell
$env:CEREBRAS_API_KEY="csk-ve6r9ehpy8knvt8yy6xmkr98jx4x6pt6f4xdftn3dedfmh6x"
python api_server.py
```

### 3. Environment Variable trong Command Prompt (Windows)

```cmd
set CEREBRAS_API_KEY=csk-ve6r9ehpy8knvt8yy6xmkr98jx4x6pt6f4xdftn3dedfmh6x
python api_server.py
```

### 4. Set trong IDE (VS Code, PyCharm)

- **VS Code**: Tạo file `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: API Server",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/backend/api_server.py",
      "env": {
        "CEREBRAS_API_KEY": "csk-ve6r9ehpy8knvt8yy6xmkr98jx4x6pt6f4xdftn3dedfmh6x"
      }
    }
  ]
}
```

- **PyCharm**: Run → Edit Configurations → Environment variables

## Thứ tự ưu tiên

Code sẽ lấy API key theo thứ tự:

1. **Environment variable** (`os.environ.get("CEREBRAS_API_KEY")`)
2. **Default value** (nếu không tìm thấy env var)

Nếu bạn set cả trong `.env` và environment variable, **environment variable sẽ được ưu tiên**.

## Kiểm tra API key đã được load chưa

Thêm vào `config.py` để debug:

```python
print(f"CEREBRAS_API_KEY loaded: {Config.CEREBRAS_API_KEY[:10]}...")  # In 10 ký tự đầu
```

## Production Deployment

Trong production (Vercel, Railway, Heroku, etc.), set environment variables qua:
- Dashboard của platform
- CLI của platform
- Secrets management tools

**Không** commit file `.env` vào Git!

## Tất cả các biến cần thiết

```env
# Required
CEREBRAS_API_KEY=your_api_key_here

# Optional (có default values)
API_HOST=0.0.0.0
API_PORT=8000
UPLOAD_TOKEN=your_secure_token
```


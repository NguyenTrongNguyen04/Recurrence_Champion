"""
Script để chạy API server - wrapper để đảm bảo .env được load
"""
import os
import sys

# Kiểm tra .env file
env_path = os.path.join(os.path.dirname(__file__), ".env")
if not os.path.exists(env_path):
    print("⚠️  Warning: File .env không tồn tại!")
    print("📝 Vui lòng tạo file .env với nội dung:")
    print("   CEREBRAS_API_KEY=your_api_key_here")
    print("\nBạn có muốn tạo file .env bây giờ? (y/n): ", end="")
    choice = input().strip().lower()
    
    if choice == 'y':
        api_key = input("Nhập CEREBRAS_API_KEY: ").strip()
        if api_key:
            with open(env_path, 'w') as f:
                f.write(f"CEREBRAS_API_KEY={api_key}\n")
            print("✅ Đã tạo file .env")
        else:
            print("❌ API key không được để trống!")
            sys.exit(1)
    else:
        print("⚠️  Tiếp tục với default API key từ code...")

# Import và chạy server
if __name__ == "__main__":
    try:
        import uvicorn
        from config import Config
        
        print("=" * 50)
        print("🚀 Starting TestFlow AI API Server")
        print("=" * 50)
        print(f"📡 Host: {Config.API_HOST}")
        print(f"🔌 Port: {Config.API_PORT}")
        print(f"🤖 Model: {Config.CEREBRAS_MODEL}")
        
        # Kiểm tra API key
        if Config.CEREBRAS_API_KEY:
            masked_key = Config.CEREBRAS_API_KEY[:10] + "..." + Config.CEREBRAS_API_KEY[-5:]
            print(f"🔑 API Key: {masked_key}")
        else:
            print("⚠️  Warning: CEREBRAS_API_KEY chưa được set!")
        
        print("=" * 50)
        print("✅ Server đang khởi động...")
        print(f"🌐 Truy cập: http://localhost:{Config.API_PORT}")
        print("📚 API Docs: http://localhost:{}/docs".format(Config.API_PORT))
        print("=" * 50)
        print()
        
        uvicorn.run(
            "api_server:app",
            host=Config.API_HOST,
            port=Config.API_PORT,
            reload=True
        )
    except KeyboardInterrupt:
        print("\n\n👋 Server đã dừng!")
    except Exception as e:
        print(f"\n❌ Lỗi khi khởi động server: {e}")
        print("\n💡 Kiểm tra lại:")
        print("   1. Đã cài đặt dependencies: pip install -r requirements.txt")
        print("   2. File .env có API key hợp lệ")
        print("   3. Port 8000 chưa bị sử dụng")
        sys.exit(1)


# backend/app/core/encryption.py
from cryptography.fernet import Fernet
from app.core.config import settings

# Initialize Fernet instance with the encryption key
def get_fernet():
    if not hasattr(settings, 'ENCRYPTION_KEY'):
        # Generate a new key if not exists
        settings.ENCRYPTION_KEY = Fernet.generate_key()
    return Fernet(settings.ENCRYPTION_KEY)

def encrypt_data(data: str) -> str:
    """
    Encrypt a string using Fernet symmetric encryption
    """
    if not data:
        return ""
    
    fernet = get_fernet()
    encrypted_data = fernet.encrypt(data.encode())
    return encrypted_data.decode()

def decrypt_data(encrypted_data: str) -> str:
    """
    Decrypt a string that was encrypted using Fernet
    """
    if not encrypted_data:
        return ""
    
    fernet = get_fernet()
    decrypted_data = fernet.decrypt(encrypted_data.encode())
    return decrypted_data.decode()
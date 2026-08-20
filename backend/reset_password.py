import argparse
import getpass
import sys
import os

# Ensure app package is visible from current folder
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

def main():
    parser = argparse.ArgumentParser(description="Reset self-hosted administrator password.")
    parser.add_argument("--username", type=str, help="Username to reset")
    parser.add_argument("--password", type=str, help="New password (will prompt securely if omitted)")
    args = parser.parse_args()

    username = args.username
    if not username:
        username = input("Enter username: ").strip()
        if not username:
            print("Error: Username cannot be empty.")
            sys.exit(1)

    password = args.password
    if not password:
        password = getpass.getpass("Enter new password: ")
        confirm_password = getpass.getpass("Confirm new password: ")
        if password != confirm_password:
            print("Error: Passwords do not match.")
            sys.exit(1)
        if not password:
            print("Error: Password cannot be empty.")
            sys.exit(1)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"Error: User '{username}' not found in database.")
            sys.exit(1)

        hashed = get_password_hash(password)
        user.password_hash = hashed
        db.commit()
        print(f"\nSuccess: Password for user '{username}' has been securely reset.")
    except Exception as e:
        db.rollback()
        print(f"Error executing password reset: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()

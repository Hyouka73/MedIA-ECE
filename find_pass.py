from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
h = "$argon2id$v=19$m=65536,t=3,p=4$oTQGIESo1do7x7hXCoFQ6g$gOPoLwFiiaF64uaEXOtZwqLJMQxST7v0ugNCW26T1eY"
passwords = ["MedSys@2026", "MedSys2026!", "MedSys@2026!", "MedSys2026", "MedSys@2024", "MedSys@2025"]
for p in passwords:
    try:
        if pwd_context.verify(p, h):
            print(f"MATCH: {p}")
    except:
        pass

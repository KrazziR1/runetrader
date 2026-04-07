import os

SRC_DIR = "./src"

def char_to_escape(ch):
    cp = ord(ch)
    if cp <= 0xFFFF:
        return "\\u{:04X}".format(cp)
    else:
        cp -= 0x10000
        high = 0xD800 + (cp >> 10)
        low  = 0xDC00 + (cp & 0x3FF)
        return "\\u{:04X}\\u{:04X}".format(high, low)

def replace_emoji(text):
    result = []
    for ch in text:
        cp = ord(ch)
        if cp > 0x00FF:
            result.append(char_to_escape(ch))
        else:
            result.append(ch)
    return "".join(result)

changed = []
for fname in os.listdir(SRC_DIR):
    if not fname.endswith(".js"):
        continue
    fpath = os.path.join(SRC_DIR, fname)
    with open(fpath, "r", encoding="utf-8", errors="replace") as f:
        original = f.read()
    converted = replace_emoji(original)
    if converted != original:
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(converted)
        changed.append(fname)
        print("  Fixed: " + fname)

if changed:
    print("\nDone. " + str(len(changed)) + " file(s) updated.")
    print("Now run: git add . && git commit -m fix-emoji && git push")
else:
    print("No emoji found - nothing changed.")

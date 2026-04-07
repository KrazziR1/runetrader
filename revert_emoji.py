import os
import re

SRC_DIR = "./src"

def unescape(match):
    s = match.group(0)
    # Handle surrogate pairs \uD800-\uDBFF followed by \uDC00-\uDFFF
    surrogate = re.match(r'\\u([Dd][89AaBb][0-9A-Fa-f]{2})\\u([Dd][Cc-Ff][0-9A-Fa-f]{2})', s)
    if surrogate:
        high = int(surrogate.group(1), 16)
        low = int(surrogate.group(2), 16)
        cp = 0x10000 + (high - 0xD800) * 0x400 + (low - 0xDC00)
        return chr(cp)
    single = re.match(r'\\u([0-9A-Fa-f]{4})', s)
    if single:
        return chr(int(single.group(1), 16))
    return s

changed = []
for fname in os.listdir(SRC_DIR):
    if not fname.endswith(".js"):
        continue
    fpath = os.path.join(SRC_DIR, fname)
    with open(fpath, "r", encoding="utf-8", errors="replace") as f:
        original = f.read()
    converted = re.sub(r'\\u[Dd][89AaBb][0-9A-Fa-f]{2}\\u[Dd][Cc-Ff][0-9A-Fa-f]{2}|\\u[0-9A-Fa-f]{4}', unescape, original)
    if converted != original:
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(converted)
        changed.append(fname)
        print("  Reverted: " + fname)

if changed:
    print("\nDone. " + str(len(changed)) + " file(s) reverted.")
    print("Now run: git add . && git commit -m revert-emoji && git push")
else:
    print("Nothing to revert.")

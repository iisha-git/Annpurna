import json

log_path = r"C:\Users\rishi\.gemini\antigravity-ide\brain\e92c8075-9477-49e7-abfc-8d79f889d47b\.system_generated\logs\transcript_full.jsonl"
for line in reversed(list(open(log_path, encoding='utf-8'))):
    if not line.strip(): continue
    try:
        j = json.loads(line)
        if j.get("source") == "USER_EXPLICIT" and "==Start of PDF==" in j.get("content", ""):
            open("scratch/ocr.txt", "w", encoding='utf-8').write(j["content"])
            print("Found it!")
            break
    except Exception as e:
        pass

import argparse
import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

QUEUE = Path(__file__).with_name("全站审查队列.json")
SHANGHAI = timezone(timedelta(hours=8), "Asia/Shanghai")

def refresh(today):
    queue = json.loads(QUEUE.read_text(encoding="utf-8-sig"))
    monday = today - timedelta(days=today.weekday())
    calendar = queue["teachingCalendar"]
    current = calendar.get(monday.isoformat())
    following = calendar.get((monday + timedelta(days=7)).isoformat())
    next_teaching = next((entry for day, entry in sorted(calendar.items())
                          if day > monday.isoformat() and isinstance(entry[1], int)), None)

    def rank(task):
        if task.get("course") in queue.get("deferredCourses", []):
            return 4
        if task["module"] != "notes":
            return 3
        key = [task["term"], task["week"] or task.get("cycle")]
        if current and key == current:
            return 0
        if following and key == following:
            return 1
        return 2

    for task in queue["tasks"]:
        task["priority"] = rank(task)
    queue["tasks"].sort(key=lambda task: (task["priority"], task["term"] or "", task["week"] or 0))
    queue["currentCycle"] = current
    queue["nextCalendarCycle"] = following
    queue["nextTeachingWeek"] = next_teaching
    return queue

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", type=date.fromisoformat, default=datetime.now(SHANGHAI).date())
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    queue = refresh(args.date)
    if args.write:
        temporary = QUEUE.with_suffix(".tmp")
        temporary.write_text(json.dumps(queue, ensure_ascii=False, indent=2), encoding="utf-8")
        temporary.replace(QUEUE)
    print(queue["currentCycle"], queue["nextCalendarCycle"], queue["nextTeachingWeek"])

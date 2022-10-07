import random
import redis
import time

STREAM_KEY = "jobs"

JOB_TYPES = [
    "cleaning",
    "room_service",
    "taxi",
    "extra_towels",
    "extra_pillows"
]

r = redis.Redis(decode_responses=True)

while True:
    job = {
        "room": random.randint(100, 500),
        "job": random.choice(JOB_TYPES)
    }

    job_id = r.xadd(STREAM_KEY, job)
    print(f"Created job {job_id}:")
    print(job)

    time.sleep(random.randint(5, 10))
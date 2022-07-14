import { createClient, commandOptions } from 'redis';

if (process.argv.length !== 3) {
  console.log('usage: node consumer_group.js <consumerName>');
  process.exit(1);
}

function randomSleep(howLong) {
  return new Promise((resolve) => {
    const howLong = Math.floor(Math.random() * (8000 - 3000) + 3000);
    setTimeout(resolve, howLong);
  });
};

const STREAM_KEY = 'jobs';
const CONSUMER_GROUP_NAME = 'staff';
const CONSUMER_NAME = process.argv[2];

const r = createClient();
await r.connect();

console.log(`Starting consumer ${CONSUMER_NAME}.`);

// Create the consumer group (and stream) if needed...
try {
  await r.xGroupCreate(STREAM_KEY, CONSUMER_GROUP_NAME, '0', {
    MKSTREAM: true
  });
  console.log('Created consumer group.');
} catch (e) {
  console.log('Consumer group already exists, skipped creation.');
}

while (true) {
  try {
    let response = await r.xReadGroup(
      commandOptions({
        isolated: true
      }),
      CONSUMER_GROUP_NAME,
      CONSUMER_NAME,
      [
        {
          key: STREAM_KEY,
          id: '>' // Next ID that no consumer in this group has seen.
        }
      ],
      {
        COUNT: 1,
        BLOCK: 5000
      }
    );

    console.log(JSON.stringify(response));

    if (response) {
      const currentJobId = response[0].messages[0].id;
      const currentJobDetails = response[0].messages[0].message;

      console.log(`Performing job ${currentJobId}: ${JSON.stringify(currentJobDetails)}`);
      await randomSleep();

      // Tell Redis we processed this job.
      await r.xAck(STREAM_KEY, CONSUMER_GROUP_NAME, currentJobId);
      console.log(`Acknowledged processing of job ${currentJobId}`);
    } else {
      console.log('Nothing to do right now.');
    }
  } catch (err) {
    console.log(err);
  }
}


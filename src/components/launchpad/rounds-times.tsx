import React, { useEffect, useState } from 'react';

interface Round {
  number: number;
  price: number; // in APE
  startTime: Date;
  endTime: Date;
}

const RoundsComponent: React.FC = () => {
  // Define rounds data inside the component
  const rounds: Round[] = [
    {
      number: 1,
      price: 10,
      startTime: new Date(Date.UTC(2024, 11, 5, 0, 0, 0)), // Dec 5, 2024
      endTime: new Date(Date.UTC(2024, 11, 19, 0, 0, 0)), // Dec 19, 2024
    },
    {
      number: 2,
      price: 50,
      startTime: new Date(Date.UTC(2024, 11, 19, 0, 0, 0)), // Dec 19, 2024
      endTime: new Date(Date.UTC(2024, 11, 24, 0, 0, 0)), // Dec 24, 2024
    },
    {
      number: 3,
      price: 100,
      startTime: new Date(Date.UTC(2024, 11, 24, 0, 0, 0)), // Dec 24, 2024
      endTime: new Date(Date.UTC(2024, 11, 27, 23, 59, 59)), // Dec 27, 2024
    },
  ];

  // Get current time and update every minute
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Helper functions
  function getRoundStatus(
    round: Round,
    now: Date
  ): 'upcoming' | 'active' | 'ended' {
    if (now < round.startTime) {
      return 'upcoming';
    } else if (now >= round.startTime && now < round.endTime) {
      return 'active';
    } else {
      return 'ended';
    }
  }

  function getTimeDifference(
    date1: Date,
    date2: Date
  ): { hours: number; minutes: number } {
    const diffInMs = date2.getTime() - date1.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return { hours, minutes };
  }

  function formatDate(date: Date): string {
    const month = date.getUTCMonth() + 1; // months from 1-12
    const day = date.getUTCDate();
    return `${month}/${day}`;
  }

  return (
    <div className="w-full text-black font-bold text-sm">
      {rounds.map((round) => {
        const status = getRoundStatus(round, now);

        let statusText = '';
        let timeText = '';

        if (status === 'active') {
          statusText = '(Current Active)';
          const timeUntilEnd = round.endTime.getTime() - now.getTime();
          if (timeUntilEnd < 10 * 60 * 60 * 1000) {
            const { hours, minutes } = getTimeDifference(now, round.endTime);
            timeText = `Ends in ${hours}h:${minutes}min`;
          } else {
            timeText = `Ends: ${formatDate(round.endTime)}`;
          }
        } else if (status === 'upcoming') {
          const timeUntilStart = round.startTime.getTime() - now.getTime();
          if (timeUntilStart < 10 * 60 * 60 * 1000) {
            const { hours, minutes } = getTimeDifference(now, round.startTime);
            timeText = `Starts in ${hours}h:${minutes}min`;
          } else {
            timeText = `Starts: ${formatDate(round.startTime)}`;
          }
        } else if (status === 'ended') {
          statusText = '(Ended)';
        }

        const textColorClass =
          status === 'active'
            ? 'text-green-500'
            : status === 'ended'
            ? 'text-red-600/50'
            : 'text-gray-600/50';

        return (
          <div key={round.number} className={`${textColorClass} mb-2 flex flex-col w-full`}>
            <div>
              Round {round.number}: {round.price} $APE{' '}
              {statusText && <span>{statusText}</span>}
            </div>
            {timeText && <div>{timeText}</div>}
          </div>
        );
      })}
    </div>
  );
};

export default RoundsComponent;

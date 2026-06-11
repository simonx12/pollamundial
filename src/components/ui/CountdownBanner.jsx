import React, { useState, useEffect } from 'react';
import { Clock, Lock } from 'lucide-react';
import './CountdownBanner.css';

// Límite oficial: Mañana (12 de Junio de 2026) al medio día (12:00:00 GMT-5)
export const POLLA_CLOSE_DEADLINE = new Date('2026-06-12T12:00:00-05:00');

const CountdownBanner = () => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = +POLLA_CLOSE_DEADLINE - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        expired: false,
      };
    } else {
      timeLeft = { expired: true };
    }

    return timeLeft;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (timeLeft.expired) {
    return (
      <div className="countdown-banner expired animate-in">
        <Lock size={18} />
        <span><strong>Polla Cerrada:</strong> Ya no se permite modificar los pronósticos.</span>
      </div>
    );
  }

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 24;

  return (
    <div className={`countdown-banner ${isUrgent ? 'urgent' : ''} animate-in`}>
      <Clock size={18} className={isUrgent ? 'animate-pulse' : ''} />
      <span>
        <strong>Cierre de Pronósticos:</strong> Faltan{' '}
        <span className="time-segment">
          {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
          {String(timeLeft.hours).padStart(2, '0')}h :{' '}
          {String(timeLeft.minutes).padStart(2, '0')}m :{' '}
          {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      </span>
    </div>
  );
};

export default CountdownBanner;

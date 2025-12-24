import React, { useState, useEffect } from 'react';
import { Calendar } from './components/Calendar';
import { SlotList } from './components/SlotList';
import { ReservationModal } from './components/ReservationModal';
import { Login } from './components/Login';
import { ReservationMap, SlotTime, Reservation, User } from './types';
import { CalendarDays, LogOut } from 'lucide-react';

// Helper to format date key
const getDateKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const App: React.FC = () => {
  // Login State with full User object
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date()); // Controls calendar view month
  const [selectedDate, setSelectedDate] = useState(new Date()); // Controls selected day
  
  // State for all reservations
  const [reservations, setReservations] = useState<ReservationMap>({});
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetSlot, setTargetSlot] = useState<SlotTime | null>(null);

  // Load reservations from local storage
  useEffect(() => {
    const saved = localStorage.getItem('smart-reservations');
    if (saved) {
      try {
        setReservations(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load reservations", e);
      }
    }
    
    // Check session
    const savedUserStr = sessionStorage.getItem('smart-user-obj');
    if (savedUserStr) {
      try {
        setCurrentUser(JSON.parse(savedUserStr));
      } catch (e) {
        console.error("Failed to restore session", e);
      }
    }
  }, []);

  // Save reservations to local storage
  useEffect(() => {
    localStorage.setItem('smart-reservations', JSON.stringify(reservations));
  }, [reservations]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('smart-user-obj', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('smart-user-obj');
  };

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const openAddModal = (slot: SlotTime) => {
    setTargetSlot(slot);
    setIsModalOpen(true);
  };

  const handleAddReservation = () => {
    if (!targetSlot || !currentUser) return;

    const dateKey = getDateKey(selectedDate);
    const newReservation: Reservation = {
      id: Math.random().toString(36).substr(2, 9),
      name: currentUser.name,
      gender: currentUser.gender,
      slot: targetSlot,
      dateStr: dateKey,
      createdAt: Date.now(),
    };

    setReservations(prev => {
      const currentList = prev[dateKey] || [];
      return {
        ...prev,
        [dateKey]: [...currentList, newReservation]
      };
    });

    setIsModalOpen(false);
  };

  // Improved delete function that finds the reservation regardless of potential date key mismatch
  const handleDeleteReservation = (id: string) => {
    setReservations(prev => {
      const newReservations = { ...prev };
      let found = false;
      
      // First try the selected date for efficiency
      const dateKey = getDateKey(selectedDate);
      if (newReservations[dateKey]?.some(r => r.id === id)) {
        newReservations[dateKey] = newReservations[dateKey].filter(r => r.id !== id);
        found = true;
      } else {
        // Fallback: search all dates
        for (const [key, list] of Object.entries(newReservations)) {
          if (list.some(r => r.id === id)) {
            newReservations[key] = list.filter(r => r.id !== id);
            found = true;
            break;
          }
        }
      }
      
      // Optimization: Remove empty keys
      if (found) {
        return newReservations;
      }
      return prev;
    });
  };

  // If not logged in, show login screen
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // Get current selected date's reservations
  const currentReservations = reservations[getDateKey(selectedDate)] || [];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <CalendarDays size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Reservation
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
               <span className={`w-2 h-2 rounded-full ${currentUser.gender === 'Male' ? 'bg-blue-500' : 'bg-rose-500'}`}></span>
               <span>{currentUser.name}님</span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-500 transition-colors p-2"
              title="로그아웃"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Column: Calendar Only */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
            <Calendar 
              currentDate={currentDate}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onMonthChange={handleMonthChange}
              reservations={reservations}
            />
          </div>

          {/* Right Column: Reservation List */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 h-auto lg:h-[calc(100vh-8rem)]">
            <SlotList 
              selectedDate={selectedDate}
              reservations={currentReservations}
              onAddClick={openAddModal}
              onDeleteClick={handleDeleteReservation}
            />
          </div>
        </div>
      </main>

      {/* Modal */}
      <ReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddReservation}
        slot={targetSlot}
        date={selectedDate}
        user={currentUser}
      />
    </div>
  );
};

export default App;

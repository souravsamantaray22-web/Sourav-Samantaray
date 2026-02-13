
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserRole, RideStatus, Location, RideDetails, UserProfile, Transaction, ChatMessage } from './types';
import { CAMPUS_LOCATIONS, MOCK_RIDER } from './constants';
import Logo from './components/Logo';
import CampusMap from './components/CampusMap';
import OnboardingFlow from './components/OnboardingFlow';
import { getSmartTravelAdvice, getPriceEstimate, getSimulatedChatResponse } from './services/geminiService';

interface RideHistoryItem {
  id: string;
  passengerName?: string;
  fromName: string;
  toName: string;
  fare: number;
  timestamp: number;
  rating?: number;
  feedback?: string;
}

const MOCK_REQUESTS = [
  { id: 'req1', passengerName: 'Priya S.', from: CAMPUS_LOCATIONS[2], to: CAMPUS_LOCATIONS[3], price: 35, rating: 5.0 },
  { id: 'req2', passengerName: 'Vikram K.', from: CAMPUS_LOCATIONS[5], to: CAMPUS_LOCATIONS[4], price: 28, rating: 4.7 },
  { id: 'req3', passengerName: 'Sneha L.', from: CAMPUS_LOCATIONS[7], to: CAMPUS_LOCATIONS[1], price: 42, rating: 4.9 },
];

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [from, setFrom] = useState<Location | undefined>();
  const [to, setTo] = useState<Location | undefined>();
  const [rideStatus, setRideStatus] = useState<RideStatus>(RideStatus.IDLE);
  const [price, setPrice] = useState<number>(0);
  const [aiTip, setAiTip] = useState<string>("");
  const [riderPos, setRiderPos] = useState<{ x: number; y: number } | undefined>();
  const [isRiderOnline, setIsRiderOnline] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Rider specific stats
  const [riderEarnings, setRiderEarnings] = useState(0);
  const [riderRidesCount, setRiderRidesCount] = useState(0);
  const [activeRideRequest, setActiveRideRequest] = useState<typeof MOCK_REQUESTS[0] | null>(null);
  const [rideHistory, setRideHistory] = useState<RideHistoryItem[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState("");

  // Rating and Feedback State
  const [ratingValue, setRatingValue] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState("");

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat, isTyping]);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedRole = localStorage.getItem('campus_role');
    const savedBalance = localStorage.getItem('campus_balance');
    const savedTransactions = localStorage.getItem('campus_transactions');
    const savedEarnings = localStorage.getItem('rider_earnings');
    const savedRidesCount = localStorage.getItem('rider_rides_count');
    const savedOnboarding = localStorage.getItem('rider_onboarded') === 'true';
    const savedRideHistory = localStorage.getItem('rider_ride_history');
    const savedAvatar = localStorage.getItem('campus_avatar');

    const initialRole = savedRole as UserRole || null;
    const initialBalance = savedBalance ? parseFloat(savedBalance) : 250;
    
    if (initialRole) setRole(initialRole);
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedEarnings) setRiderEarnings(parseFloat(savedEarnings));
    if (savedRidesCount) setRiderRidesCount(parseInt(savedRidesCount));
    if (savedRideHistory) setRideHistory(JSON.parse(savedRideHistory));

    setUser({
      id: 'u123',
      name: 'Rahul Kapoor',
      college: 'IIT Delhi',
      role: initialRole || UserRole.PASSENGER,
      balance: initialBalance,
      rating: 4.9,
      hasCompletedOnboarding: savedOnboarding,
      avatarUrl: savedAvatar || undefined
    });
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('campus_balance', user.balance.toString());
      localStorage.setItem('campus_transactions', JSON.stringify(transactions));
      localStorage.setItem('rider_earnings', riderEarnings.toString());
      localStorage.setItem('rider_rides_count', riderRidesCount.toString());
      localStorage.setItem('rider_onboarded', (user.hasCompletedOnboarding || false).toString());
      localStorage.setItem('rider_ride_history', JSON.stringify(rideHistory));
      if (user.avatarUrl) localStorage.setItem('campus_avatar', user.avatarUrl);
    }
  }, [user?.balance, transactions, riderEarnings, riderRidesCount, user?.hasCompletedOnboarding, rideHistory, user?.avatarUrl]);

  const handleSelectRole = (selectedRole: UserRole) => {
    if (selectedRole === UserRole.RIDER && !user?.hasCompletedOnboarding) {
      setShowOnboarding(true);
      return;
    }
    
    setRole(selectedRole);
    localStorage.setItem('campus_role', selectedRole);
    setUser(prev => prev ? { ...prev, role: selectedRole } : null);
    setRideStatus(RideStatus.IDLE);
    setFrom(undefined);
    setTo(undefined);
    setChatMessages([]);
    setUnreadCount(0);
    setRiderPos(undefined);
    setShowProfile(false);
  };

  const handleOnboardingComplete = (details: { bikeModel: string; plateNumber: string; avatarUrl?: string }) => {
    setShowOnboarding(false);
    setUser(prev => prev ? { 
      ...prev, 
      hasCompletedOnboarding: true, 
      role: UserRole.RIDER,
      avatarUrl: details.avatarUrl || prev.avatarUrl 
    } : null);
    setRole(UserRole.RIDER);
    localStorage.setItem('campus_role', UserRole.RIDER);
    localStorage.setItem('rider_onboarded', 'true');
    if (details.avatarUrl) localStorage.setItem('campus_avatar', details.avatarUrl);
  };

  const processPayment = (amount: number, description: string) => {
    if (!user) return;
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      amount,
      type: amount < 0 ? 'DEBIT' : 'CREDIT',
      description,
      timestamp: Date.now()
    };
    setTransactions(prev => [newTransaction, ...prev]);
    setUser(prev => prev ? { ...prev, balance: prev.balance + amount } : null);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !user || !role) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput,
      senderId: user.id,
      senderRole: role,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");

    setIsTyping(true);
    const otherName = role === UserRole.PASSENGER ? MOCK_RIDER.name : activeRideRequest?.passengerName || "Student";
    const response = await getSimulatedChatResponse(chatInput, role, otherName);
    
    setTimeout(() => {
      setIsTyping(false);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        senderId: "other",
        senderRole: role === UserRole.PASSENGER ? UserRole.RIDER : UserRole.PASSENGER,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, aiMsg]);
      if (!showChat) setUnreadCount(prev => prev + 1);
    }, 1500);
  };

  const searchingTimerRef = useRef<any>(null);

  const handleBookRide = async () => {
    if (!from || !to || !user) return;
    if (user.balance < price) {
      setError("Insufficient balance. Please top up your wallet.");
      return;
    }
    setRideStatus(RideStatus.SEARCHING);
    setError(null);
    
    // Clear any existing timer if user updates the search
    if (searchingTimerRef.current) clearTimeout(searchingTimerRef.current);

    searchingTimerRef.current = setTimeout(async () => {
      setRideStatus(RideStatus.ACCEPTED);
      setRiderPos({ x: 10, y: 10 });
      const advice = await getSmartTravelAdvice(from.name, to.name, "Normal campus traffic");
      setAiTip(advice);
      
      setTimeout(() => {
        setChatMessages([{
          id: 'welcome',
          text: `Bhai, main location ke paas hoon. Black Activa hai.`,
          senderId: 'other',
          senderRole: UserRole.RIDER,
          timestamp: Date.now()
        }]);
        setUnreadCount(1);
      }, 3000);
    }, 4000); 
  };

  const handleCancelRide = () => {
    if (searchingTimerRef.current) clearTimeout(searchingTimerRef.current);
    setRideStatus(RideStatus.IDLE);
    setFrom(undefined);
    setTo(undefined);
    setAiTip("");
    setRiderPos(undefined);
    setChatMessages([]);
    setUnreadCount(0);
    setShowCancelConfirm(false);
    setActiveRideRequest(null);
  };

  const handleAcceptRequest = (req: typeof MOCK_REQUESTS[0]) => {
    setActiveRideRequest(req);
    setFrom(req.from);
    setTo(req.to);
    setPrice(req.price);
    setRideStatus(RideStatus.ACCEPTED);
    setRiderPos({ x: 50, y: 50 });
    setAiTip(`Picking up ${req.passengerName} at ${req.from.name}.`);
    
    setChatMessages([{
      id: 'init',
      text: `Hey ${req.passengerName.split(' ')[0]}, correct location pe aa jao please.`,
      senderId: user?.id || 'r1',
      senderRole: UserRole.RIDER,
      timestamp: Date.now()
    }]);
  };

  const handleFinishRiderSession = () => {
    const historyItem: RideHistoryItem = {
      id: Math.random().toString(36).substring(7),
      passengerName: activeRideRequest?.passengerName,
      fromName: from?.name || "Unknown",
      toName: to?.name || "Unknown",
      fare: price,
      timestamp: Date.now(),
      rating: ratingValue,
      feedback: feedbackText
    };
    setRideHistory(prev => [historyItem, ...prev]);

    setRideStatus(RideStatus.IDLE);
    setFrom(undefined);
    setTo(undefined);
    setActiveRideRequest(null);
    setRiderPos({ x: 50, y: 50 });
    setChatMessages([]);
    setRatingValue(0);
    setFeedbackText("");
  };

  const handleAddFunds = () => {
    processPayment(100, "Wallet Recharge (Demo)");
  };

  const handleSignOut = () => {
    setRole(null);
    localStorage.removeItem('campus_role');
    setShowProfile(false);
  };

  const toggleRiderOnline = () => {
    const nextOnline = !isRiderOnline;
    setIsRiderOnline(nextOnline);
    if (rideStatus === RideStatus.IDLE) {
      if (nextOnline) {
        setRiderPos({ x: 25, y: 25 });
      } else {
        setFrom(undefined);
        setTo(undefined);
        setRiderPos(undefined);
      }
    }
  };

  useEffect(() => {
    let interval: any;
    const targetLoc = rideStatus === RideStatus.ACCEPTED ? from : to;
    if ((rideStatus === RideStatus.ACCEPTED || rideStatus === RideStatus.IN_PROGRESS) && riderPos && targetLoc) {
      interval = setInterval(() => {
        setRiderPos(prev => {
          if (!prev) return prev;
          const dx = targetLoc.coords.x - prev.x;
          const dy = targetLoc.coords.y - prev.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 2) {
            if (rideStatus === RideStatus.ACCEPTED) setRideStatus(RideStatus.ARRIVED);
            else {
              setRideStatus(RideStatus.COMPLETED);
              if (role === UserRole.PASSENGER) processPayment(-price, `Ride to ${to?.name}`);
              else {
                setRiderEarnings(prev => prev + price);
                setRiderRidesCount(prev => prev + 1);
              }
            }
            clearInterval(interval);
            return targetLoc.coords;
          }
          return { x: prev.x + (dx / dist) * 2, y: prev.y + (dy / dist) * 2 };
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [rideStatus, riderPos, from, to, price, role]);

  const updatePrice = useCallback(async () => {
    if (from && to && role === UserRole.PASSENGER) {
      const estimate = await getPriceEstimate(from.name, to.name);
      setPrice(estimate.estimatedFare);
    }
  }, [from, to, role]);

  useEffect(() => {
    updatePrice();
  }, [updatePrice]);

  const profileAvatar = user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`;

  const filteredHistory = rideHistory.filter(item => {
    const query = historySearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      item.passengerName?.toLowerCase().includes(query) ||
      item.fromName.toLowerCase().includes(query) ||
      item.toName.toLowerCase().includes(query)
    );
  });

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} onCancel={() => setShowOnboarding(false)} />;
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Logo size="lg" />
        <p className="text-slate-500 mt-4 text-center max-w-xs italic font-medium">Safe student ride-sharing for Indian campuses.</p>
        <div className="grid grid-cols-1 gap-5 w-full max-w-sm mt-12" role="group" aria-label="Role selection">
          <button 
            onClick={() => handleSelectRole(UserRole.PASSENGER)} 
            aria-label="I need a ride as a passenger"
            className="group relative bg-white p-6 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-indigo-500 text-left"
          >
            <div className="bg-indigo-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h3 className="text-xl font-black text-slate-800 italic">I need a ride</h3>
            <p className="text-slate-500 text-sm mt-1">Get to classes faster.</p>
          </button>
          <button 
            onClick={() => handleSelectRole(UserRole.RIDER)} 
            aria-label="I have a bike and want to be a rider"
            className="group relative bg-white p-6 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-amber-500 text-left"
          >
            <div className="bg-amber-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="9" cy="5" r="1"/><path d="M12 12l2-7 1 1"/><path d="M7 5.9a3 3 0 1 1 5.4 0"/><path d="M16 11.5l-4-4.5-3 3 5 5"/></svg>
            </div>
            <h3 className="text-xl font-black text-slate-800 italic">I have a bike</h3>
            <p className="text-slate-500 text-sm mt-1">Earn rewards on every ride.</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl flex flex-col relative overflow-hidden">
      {/* Modals Overlays */}
      {showCancelConfirm && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
          <div className="bg-white w-full rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </div>
            <div className="text-center space-y-2">
              <h3 id="cancel-title" className="text-2xl font-black text-slate-800 italic">Cancel Ride?</h3>
              <p className="text-slate-500 font-bold text-sm">Are you sure you want to cancel your campus ride?</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleCancelRide} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-100">Yes, Cancel</button>
              <button onClick={() => setShowCancelConfirm(false)} className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest">Keep Ride</button>
            </div>
          </div>
        </div>
      )}

      {showWallet && (
        <div className="absolute inset-0 bg-white z-50 animate-in slide-in-from-right duration-300 flex flex-col" role="dialog" aria-modal="true" aria-labelledby="wallet-title">
          <header className="p-6 flex items-center gap-4 border-b border-slate-100">
            <button onClick={() => setShowWallet(false)} aria-label="Close wallet" className="p-2 -ml-2 rounded-full hover:bg-slate-100 focus:ring-2 ring-indigo-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h2 id="wallet-title" className="text-xl font-bold text-slate-800">Campus Wallet</h2>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden" tabIndex={0}>
              <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-1">Current Balance</p>
              <h3 className="text-5xl font-black italic">₹{user?.balance.toFixed(2)}</h3>
              <button onClick={handleAddFunds} className="mt-6 bg-white text-indigo-600 px-6 py-2 rounded-2xl font-bold text-sm hover:bg-indigo-50 active:scale-95 transition-all focus:ring-4 ring-white/50">Quick Add ₹100</button>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-slate-400 uppercase tracking-widest text-xs">Recent Activity</h4>
              {transactions.length === 0 ? (
                <p className="text-slate-400 italic text-sm text-center py-10">No recent transactions.</p>
              ) : (
                <div role="list" className="space-y-3">
                {transactions.map(tx => (
                  <div key={tx.id} role="listitem" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{tx.description}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                    <p className={`font-black ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-slate-800'}`} aria-label={`${tx.type === 'CREDIT' ? 'Credit of' : 'Debit of'} ₹${Math.abs(tx.amount).toFixed(2)}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showChat && (
        <div className="absolute inset-0 bg-white z-50 animate-in slide-in-from-bottom duration-300 flex flex-col" role="dialog" aria-modal="true" aria-labelledby="chat-title">
          <header className="p-6 flex items-center justify-between border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur z-20">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowChat(false)} aria-label="Close chat" className="p-2 -ml-2 rounded-full hover:bg-slate-100 focus:ring-2 ring-indigo-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <div>
                <h2 id="chat-title" className="text-lg font-black text-slate-800 leading-tight italic">
                  {role === UserRole.PASSENGER ? MOCK_RIDER.name : activeRideRequest?.passengerName || "Chat"}
                </h2>
                <p className="text-[10px] text-green-500 font-black uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" aria-hidden="true"></span>
                  Live Student Chat
                </p>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50" aria-live="polite">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <p className="text-xs font-black uppercase tracking-widest text-center">Coordinate your pick up<br/>Keep it friendly!</p>
              </div>
            ) : (
              chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                  <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-bold shadow-sm ${msg.senderId === user?.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                    {msg.text}
                    <div className={`text-[9px] mt-1 opacity-50 ${msg.senderId === user?.id ? 'text-white' : 'text-slate-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white px-5 py-3 rounded-2xl text-[10px] font-black text-slate-400 border border-slate-100 italic animate-pulse">
                  {role === UserRole.PASSENGER ? MOCK_RIDER.name : activeRideRequest?.passengerName} is typing...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <input 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Aa raha hoon bhai..."
                aria-label="Message text"
                className="flex-1 bg-slate-50 border-none focus:ring-4 ring-indigo-500/10 rounded-2xl px-5 py-3 text-sm font-bold placeholder:text-slate-300 placeholder:italic"
              />
              <button 
                onClick={sendMessage}
                disabled={!chatInput.trim()}
                aria-label="Send message"
                className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 active:scale-90 transition-all shadow-xl shadow-indigo-100 disabled:opacity-20 disabled:scale-100 focus:ring-2 ring-indigo-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="absolute inset-0 bg-white z-50 animate-in slide-in-from-bottom duration-300 flex flex-col" role="dialog" aria-modal="true" aria-labelledby="profile-title">
          <header className="p-6 flex items-center gap-4 border-b border-slate-100">
            <button onClick={() => setShowProfile(false)} aria-label="Close profile" className="p-2 -ml-2 rounded-full hover:bg-slate-100 focus:ring-2 ring-indigo-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h2 id="profile-title" className="text-xl font-bold text-slate-800">My Profile</h2>
          </header>
          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar text-center">
            <div className="space-y-4">
              <div className="w-32 h-32 rounded-[3rem] bg-indigo-100 mx-auto border-4 border-white shadow-xl overflow-hidden ring-4 ring-indigo-50" aria-hidden="true">
                 <img src={profileAvatar} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800 italic leading-tight">{user?.name}</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{user?.college}</p>
              </div>
              <div className="flex justify-center gap-2" aria-label={`Rating: ${user?.rating} stars`}>
                 {[...Array(5)].map((_, i) => (
                   <span key={i} className={`text-xl ${i < Math.floor(user?.rating || 0) ? 'text-amber-400' : 'text-slate-200'}`} aria-hidden="true">★</span>
                 ))}
                 <span className="ml-2 font-black text-slate-800 italic" aria-hidden="true">{user?.rating}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-10">
              <button 
                onClick={handleSignOut}
                className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-lg italic shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 focus:ring-4 ring-slate-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
                Sign Out / Switch Role
              </button>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Version 1.0.4 Campus Beta</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-slate-100 bg-white/80 backdrop-blur sticky top-0 z-40">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <button onClick={() => setShowWallet(true)} aria-label={`Wallet balance: ₹${user?.balance.toFixed(2)}`} className="text-right hover:bg-slate-50 p-1 px-2 rounded-xl transition-colors focus:ring-2 ring-indigo-500">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest" aria-hidden="true">Wallet</p>
            <p className="font-black text-slate-800" aria-hidden="true">₹{user?.balance.toFixed(2)}</p>
          </button>
          <button onClick={() => setShowProfile(true)} aria-label="Open profile" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-2 ring-indigo-50 focus:ring-indigo-600">
            <img src={profileAvatar} alt="" className="w-full h-full object-cover" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar pb-32">
        {role === UserRole.PASSENGER ? (
          <>
            <section className="space-y-3" aria-labelledby="map-heading">
              <div className="flex justify-between items-center px-1">
                <h2 id="map-heading" className="text-xl font-black text-slate-800 italic">Where to?</h2>
                {(rideStatus === RideStatus.IDLE || rideStatus === RideStatus.SEARCHING) && (
                   <span className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-indigo-100" aria-label="Status: Live Campus Map active">Live Campus Map</span>
                )}
              </div>
              <CampusMap 
                selectedFrom={from} 
                selectedTo={to} 
                onSelectLocation={(loc) => {
                  if (rideStatus !== RideStatus.IDLE && rideStatus !== RideStatus.SEARCHING) return;
                  if (!from) setFrom(loc);
                  else if (!to) setTo(loc);
                  else { setFrom(loc); setTo(undefined); }
                }} 
                riderPosition={riderPos}
              />
            </section>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-3xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2" role="alert">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
                <button onClick={handleAddFunds} className="ml-auto underline font-black focus:ring-2 ring-red-200">Top up</button>
              </div>
            )}

            {(rideStatus === RideStatus.IDLE || rideStatus === RideStatus.SEARCHING) && (
              <div className="space-y-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 relative group" aria-label="Route selection">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-indigo-600" aria-hidden="true"></div>
                  <label htmlFor="from-location" className="sr-only">Pick up point</label>
                  <select 
                    id="from-location"
                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 font-black text-sm uppercase tracking-widest outline-none"
                    value={from?.id || ""}
                    onChange={(e) => setFrom(CAMPUS_LOCATIONS.find(l => l.id === e.target.value))}
                  >
                    <option value="" disabled>Pick up point</option>
                    {CAMPUS_LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="h-6 border-l-2 border-dotted border-slate-300 ml-[3px]" aria-hidden="true"></div>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true"></div>
                  <label htmlFor="to-location" className="sr-only">Destination point</label>
                  <select 
                    id="to-location"
                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 font-black text-sm uppercase tracking-widest outline-none"
                    value={to?.id || ""}
                    onChange={(e) => setTo(CAMPUS_LOCATIONS.find(l => l.id === e.target.value))}
                  >
                    <option value="" disabled>Destination point</option>
                    {CAMPUS_LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                {rideStatus === RideStatus.SEARCHING && (
                  <div className="absolute top-2 right-4 text-[10px] font-black text-indigo-500 animate-pulse uppercase tracking-widest" aria-live="polite">Editing Search...</div>
                )}
              </div>
            )}

            {rideStatus !== RideStatus.IDLE && (
              <div className="bg-white p-7 rounded-[3rem] border-2 border-indigo-100 shadow-2xl space-y-6 animate-in zoom-in-95 duration-500 relative overflow-hidden" aria-live="assertive">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-slate-800 text-2xl tracking-tight italic leading-tight">
                      {rideStatus === RideStatus.SEARCHING && "Finding a rider..."}
                      {rideStatus === RideStatus.ACCEPTED && "Rider on the way!"}
                      {rideStatus === RideStatus.ARRIVED && "Rider is here!"}
                      {rideStatus === RideStatus.IN_PROGRESS && "On the move!"}
                      {rideStatus === RideStatus.COMPLETED && "Ride Completed!"}
                    </h3>
                  </div>
                  {rideStatus === RideStatus.SEARCHING && (
                    <div className="w-10 h-10 border-[5px] border-indigo-600 border-t-transparent rounded-full animate-spin" aria-label="Searching spinner"></div>
                  )}
                </div>

                {(rideStatus === RideStatus.ACCEPTED || rideStatus === RideStatus.ARRIVED || rideStatus === RideStatus.IN_PROGRESS) && (
                  <div className="flex items-center justify-between bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center font-black text-indigo-600 text-xl italic shadow-sm" aria-hidden="true">A</div>
                      <div>
                        <p className="font-black text-slate-800">{MOCK_RIDER.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{MOCK_RIDER.bike} • {MOCK_RIDER.plate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-amber-500 font-black flex items-center text-sm gap-1 justify-end" aria-label={`Rider rating: ${MOCK_RIDER.rating} stars`}>★ {MOCK_RIDER.rating}</span>
                    </div>
                  </div>
                )}

                {rideStatus === RideStatus.ARRIVED && (
                  <button 
                    onClick={() => setRideStatus(RideStatus.IN_PROGRESS)}
                    className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black shadow-2xl shadow-indigo-100 active:scale-95 transition-all text-lg flex items-center justify-center gap-3 focus:ring-4 ring-indigo-200"
                  >
                    <span>Board Vehicle</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </button>
                )}

                {(rideStatus === RideStatus.SEARCHING || rideStatus === RideStatus.ACCEPTED) && (
                  <button 
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full py-2 text-red-500 font-black uppercase tracking-[0.2em] text-[10px] hover:text-red-700 transition-colors focus:underline"
                  >
                    Cancel Ride
                  </button>
                )}

                {rideStatus === RideStatus.COMPLETED && (
                  <div className="space-y-4">
                    <div className="p-6 bg-green-50 rounded-[2.5rem] border border-green-100 text-center">
                      <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">Payment Success</p>
                      <p className="text-3xl font-black text-slate-800 italic">₹{price.toFixed(2)}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setRideStatus(RideStatus.IDLE);
                        setFrom(undefined);
                        setTo(undefined);
                        setAiTip("");
                        setRiderPos(undefined);
                      }}
                      className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black active:scale-95 transition-transform focus:ring-4 ring-slate-200"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-7">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">Rider Desk</h2>
              <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-full px-4 border border-slate-100">
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${isRiderOnline ? 'text-green-600' : 'text-slate-400'}`}>
                  {isRiderOnline ? 'Online' : 'Offline'}
                </span>
                <button 
                  onClick={toggleRiderOnline}
                  aria-label={isRiderOnline ? "Go offline" : "Go online"}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-sm ${isRiderOnline ? 'bg-green-500 shadow-lg shadow-green-100' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 transform ${isRiderOnline ? 'translate-x-6' : 'translate-x-1'}`} aria-hidden="true"></div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4" role="region" aria-label="Rider stats">
              <div className="bg-white p-7 rounded-[2.5rem] border-2 border-slate-100 shadow-sm group hover:border-amber-100 transition-colors" tabIndex={0}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Today's Cash</p>
                <p className="text-3xl font-black text-slate-800 italic">₹{riderEarnings.toFixed(0)}</p>
              </div>
              <div className="bg-white p-7 rounded-[2.5rem] border-2 border-slate-100 shadow-sm group hover:border-indigo-100 transition-colors" tabIndex={0}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trips Done</p>
                <p className="text-3xl font-black text-slate-800 italic">{riderRidesCount}</p>
              </div>
            </div>

            <div className="relative">
              <CampusMap 
                 selectedFrom={from} 
                 selectedTo={to}
                 riderPosition={riderPos}
                 activeRequests={isRiderOnline && rideStatus === RideStatus.IDLE ? MOCK_REQUESTS : []}
                 showZones={isRiderOnline}
               />
               {!isRiderOnline && rideStatus === RideStatus.IDLE && (
                 <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] rounded-[3rem] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500" aria-hidden="true">
                    <div className="bg-white/90 backdrop-blur px-6 py-2 rounded-2xl shadow-xl border border-white flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Tracking Paused</span>
                    </div>
                 </div>
               )}
            </div>

            {rideStatus !== RideStatus.IDLE ? (
              <div className="bg-white p-8 rounded-[3rem] border-2 border-amber-200 shadow-2xl space-y-6 animate-in slide-in-from-bottom-4" aria-live="polite">
                <h3 className="font-black text-slate-800 text-2xl tracking-tight italic leading-tight">
                  {rideStatus === RideStatus.ACCEPTED && "Going to Passenger"}
                  {rideStatus === RideStatus.ARRIVED && "Ready for Pick up"}
                  {rideStatus === RideStatus.IN_PROGRESS && "On the way!"}
                  {rideStatus === RideStatus.COMPLETED && "Job Complete!"}
                </h3>
                {rideStatus === RideStatus.COMPLETED && (
                  <div className="space-y-6">
                    <div className="p-6 bg-amber-50 rounded-[2.5rem] border border-amber-100 text-center" tabIndex={0}>
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Total Earnings</p>
                      <p className="text-4xl font-black text-slate-800 italic">₹{price.toFixed(2)}</p>
                    </div>
                    <div className="space-y-4 pt-2">
                       <p className="text-center font-black text-slate-800 text-sm">Rate {activeRideRequest?.passengerName.split(' ')[0]}</p>
                       <div className="flex justify-center gap-2" role="group" aria-label="Rate passenger">
                         {[1, 2, 3, 4, 5].map((star) => (
                           <button 
                            key={star} 
                            onClick={() => setRatingValue(star)}
                            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                            aria-pressed={star <= ratingValue}
                            className={`text-4xl transition-all ${star <= ratingValue ? 'text-amber-500 scale-110' : 'text-slate-200 hover:text-amber-200'}`}
                           >
                             ★
                           </button>
                         ))}
                       </div>
                       <label htmlFor="rider-feedback" className="sr-only">Rider feedback</label>
                       <textarea 
                         id="rider-feedback"
                         value={feedbackText}
                         onChange={(e) => setFeedbackText(e.target.value)}
                         placeholder="Optional: How was the student's behavior?"
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold focus:border-amber-500 outline-none min-h-[80px]"
                       />
                    </div>
                    <button 
                      onClick={handleFinishRiderSession} 
                      disabled={ratingValue === 0}
                      className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black active:scale-95 transition-transform disabled:opacity-20 focus:ring-4 ring-slate-200"
                    >
                      Submit & Finish
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {isRiderOnline && (
                  <div className="space-y-4 animate-in slide-in-from-bottom-4" role="region" aria-label="Available requests">
                    <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.25em] pl-1">Live Requests</h3>
                    <div role="list" className="space-y-4">
                    {MOCK_REQUESTS.map(req => (
                      <div key={req.id} role="listitem" className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all">
                        <div>
                           <h4 className="font-black text-slate-800 text-lg">{req.passengerName}</h4>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{req.from.name.substring(0, 15)}...</p>
                        </div>
                        <button onClick={() => handleAcceptRequest(req)} aria-label={`Accept ride request from ${req.passengerName} for ₹${req.price}`} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm italic shadow-lg focus:ring-4 ring-indigo-200">Accept ₹{req.price}</button>
                      </div>
                    ))}
                    </div>
                  </div>
                )}
                
                {!isRiderOnline && (
                  <div className="bg-slate-50 border-2 border-dotted border-slate-200 p-10 rounded-[3rem] text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
                     <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto shadow-sm text-slate-300" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
                     </div>
                     <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-800 italic">You're Currently Offline</h3>
                        <p className="text-slate-500 font-bold text-sm">Go online to start receiving student ride requests near you.</p>
                     </div>
                     <button 
                      onClick={toggleRiderOnline}
                      className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-lg italic shadow-xl shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto focus:ring-4 ring-indigo-200"
                     >
                       <span>Go Online Now</span>
                       <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-hidden="true" />
                     </button>
                  </div>
                )}

                {/* Dashboard Ride History Section */}
                <section className="space-y-5 pt-4 border-t border-slate-100" aria-labelledby="history-heading">
                  <div className="flex items-center justify-between px-1">
                    <h4 id="history-heading" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Ride History Dashboard</h4>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest" aria-label={`${rideHistory.length} rides total`}>{rideHistory.length} Total</span>
                  </div>

                  {rideHistory.length > 0 && (
                    <div className="relative group/search">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                      </div>
                      <label htmlFor="history-search" className="sr-only">Search ride history</label>
                      <input 
                        id="history-search"
                        type="text"
                        placeholder="Search passenger or destination..."
                        value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-4 pl-12 pr-12 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:ring-4 ring-indigo-500/10 focus:border-indigo-200 focus:bg-white outline-none transition-all shadow-sm"
                      />
                      {historySearchQuery && (
                        <button 
                          onClick={() => setHistorySearchQuery("")}
                          aria-label="Clear search"
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 flex items-center justify-center transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      )}
                    </div>
                  )}

                  <div aria-live="polite">
                  {rideHistory.length === 0 ? (
                    <div className="bg-slate-50 p-12 rounded-[3rem] border-2 border-dotted border-slate-200 text-center space-y-3">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-slate-200" aria-hidden="true">
                         <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
                      </div>
                      <p className="text-slate-400 italic font-bold text-sm">No rides completed yet.</p>
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="py-12 text-center space-y-4 animate-in fade-in">
                       <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300" aria-hidden="true">
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M15 11l-4 4"/><path d="M11 11l4 4"/></svg>
                       </div>
                       <p className="text-slate-500 italic font-bold text-sm">No matches for "{historySearchQuery}"</p>
                       <button onClick={() => setHistorySearchQuery("")} className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline focus:ring-2 ring-indigo-100">Clear Search</button>
                    </div>
                  ) : (
                    <div role="list" className="space-y-3 pb-4">
                      {filteredHistory.map(item => (
                        <div key={item.id} role="listitem" className="bg-white p-5 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all shadow-sm hover:shadow-md" tabIndex={0}>
                          <div className="space-y-1.5 max-w-[70%]">
                            <div className="flex items-center gap-2">
                               <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-sm shadow-indigo-200 shrink-0" aria-hidden="true"></span>
                               <p className="text-xs font-black text-slate-800 truncate leading-none">
                                 {item.passengerName ? `${item.passengerName}: ` : ''}{item.fromName} → {item.toName}
                               </p>
                            </div>
                            <div className="flex items-center gap-3 pl-5">
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter italic" aria-label={`Date: ${new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}>
                                {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </p>
                              {item.rating && (
                                <span className="text-[10px] font-black text-amber-500 flex items-center gap-0.5" aria-label={`Rating: ${item.rating} stars`}>
                                  ★ {item.rating}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                             <p className="font-black text-green-600 text-sm italic" aria-label={`Earned ₹${item.fare}`}>+₹{item.fare}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </main>

      {/* Passenger Booking Bar */}
      {role === UserRole.PASSENGER && (rideStatus === RideStatus.IDLE || rideStatus === RideStatus.SEARCHING) && (
        <div className="absolute bottom-28 left-0 right-0 px-6 animate-in slide-in-from-bottom-8 duration-700">
          <button 
            disabled={!from || !to}
            onClick={handleBookRide}
            className={`w-full py-5 rounded-[2.5rem] font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-4 group focus:ring-4
              ${from && to ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 ring-indigo-200' : 'bg-slate-100 text-slate-300 cursor-not-allowed ring-slate-100'}
            `}
          >
            {from && to ? (
              <>
                <span className="italic">{rideStatus === RideStatus.SEARCHING ? 'Update Search' : 'Book Ride'}</span> 
                <span className="bg-white/20 px-3 py-1 rounded-xl text-sm" aria-label={`Price estimate: ₹${price}`}>₹{price}</span>
              </>
            ) : (
              <span className="text-xs uppercase tracking-[0.3em]">Set Locations</span>
            )}
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-t border-slate-100 px-10 py-5 flex justify-between items-center sticky bottom-0 z-40" aria-label="Main navigation">
        <button onClick={() => { setShowWallet(false); setShowChat(false); setShowProfile(false); }} aria-label="Home" aria-current={(!showChat && !showWallet && !showProfile) ? "page" : undefined} className={`flex flex-col items-center gap-1.5 focus:ring-2 ring-indigo-500 p-1 rounded-xl ${(!showChat && !showWallet && !showProfile) ? 'text-indigo-600' : 'text-slate-400'}`}>
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
           <span className="text-[9px] font-black uppercase tracking-[0.2em]">Home</span>
        </button>
        <button onClick={() => setShowWallet(true)} aria-label="Wallet" aria-current={showWallet ? "page" : undefined} className={`flex flex-col items-center gap-1.5 focus:ring-2 ring-indigo-500 p-1 rounded-xl ${showWallet ? 'text-indigo-600' : 'text-slate-400'}`}>
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
           <span className="text-[9px] font-black uppercase tracking-[0.2em]">Wallet</span>
        </button>
        <button onClick={() => { setShowChat(true); setUnreadCount(0); }} aria-label={`Chat${unreadCount > 0 ? `, ${unreadCount} unread messages` : ''}`} aria-current={showChat ? "page" : undefined} className={`flex flex-col items-center gap-1.5 relative focus:ring-2 ring-indigo-500 p-1 rounded-xl ${showChat ? 'text-indigo-600' : 'text-slate-400'}`}>
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
           {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white" aria-hidden="true">{unreadCount}</span>}
           <span className="text-[9px] font-black uppercase tracking-[0.2em]">Chat</span>
        </button>
        <button onClick={() => setShowProfile(true)} aria-label="Profile" aria-current={showProfile ? "page" : undefined} className={`flex flex-col items-center gap-1.5 focus:ring-2 ring-indigo-500 p-1 rounded-xl ${showProfile ? 'text-indigo-600' : 'text-slate-400'}`}>
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
           <span className="text-[9px] font-black uppercase tracking-[0.2em]">Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default App;

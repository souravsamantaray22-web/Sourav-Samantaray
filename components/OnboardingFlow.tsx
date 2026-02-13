
import React, { useState, useEffect, useRef } from 'react';

interface OnboardingFlowProps {
  onComplete: (details: { bikeModel: string; plateNumber: string; avatarUrl?: string }) => void;
  onCancel: () => void;
}

const AVATAR_OPTIONS = [
  { id: 'av1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { id: 'av2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
  { id: 'av3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tigger' },
  { id: 'av4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scooter' },
  { id: 'av5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Buster' },
  { id: 'av6', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack' },
];

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [bikeModel, setBikeModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [profileImage, setProfileImage] = useState<string | undefined>();
  const [avatarMode, setAvatarMode] = useState<'upload' | 'library'>('upload');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isScanningDoc, setIsScanningDoc] = useState(false);
  const [docVerified, setDocVerified] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = 5;

  const nextStep = () => {
    setCompletedSteps(prev => [...new Set([...prev, step])]);
    setStep(s => Math.min(s + 1, totalSteps));
  };
  
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleFinish = () => {
    onComplete({ bikeModel, plateNumber, avatarUrl: profileImage });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingPhoto(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTimeout(() => {
          setProfileImage(reader.result as string);
          setIsUploadingPhoto(false);
        }, 800);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectAvatar = (url: string) => {
    setProfileImage(url);
  };

  const handleSimulateDocUpload = () => {
    if (docVerified) {
      nextStep();
      return;
    }
    setIsScanningDoc(true);
    setTimeout(() => {
      setIsScanningDoc(false);
      setDocVerified(true);
      setTimeout(() => {
        nextStep();
      }, 1200);
    }, 2500);
  };

  useEffect(() => {
    if (step === 5) {
      setShowConfetti(true);
    }
  }, [step]);

  return (
    <div className="fixed inset-0 bg-[#fdfdfd] z-[100] flex flex-col overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[30%] bg-indigo-50 rounded-full blur-[100px] pointer-events-none opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[30%] bg-amber-50 rounded-full blur-[100px] pointer-events-none opacity-50" />

      <div className="relative z-10 px-6 pt-8 pb-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={onCancel} 
            aria-label="Cancel onboarding"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-slate-600 active:scale-90 transition-all focus:ring-2 ring-indigo-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          
          <div className="flex gap-2" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Onboarding progress: step ${step} of ${totalSteps}`}>
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s}
                className={`w-8 h-1.5 rounded-full transition-all duration-500 ${
                  s === step 
                    ? 'w-12 bg-indigo-600' 
                    : completedSteps.includes(s) 
                      ? 'bg-green-500' 
                      : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          <div className="w-10" />
        </div>
        <div className="text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
            {step === 5 ? 'Welcome Onboard' : `Step ${step} of ${totalSteps}`}
          </span>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
              <div className="relative inline-block" aria-hidden="true">
                <div className="w-24 h-24 bg-indigo-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-200 rotate-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="9" cy="5" r="1"/><path d="M12 12l2-7 1 1"/><path d="M7 5.9a3 3 0 1 1 5.4 0"/><path d="M16 11.5l-4-4.5-3 3 5 5"/></svg>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-400 rounded-2xl flex items-center justify-center text-white shadow-lg -rotate-12">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                </div>
              </div>

              <div className="space-y-2">
                <h2 id="onboarding-title" className="text-4xl font-black text-slate-800 italic leading-[1.1] tracking-tight">Register Your<br/><span className="text-indigo-600">Bhai-Mobile</span></h2>
                <p className="text-slate-500 font-bold text-lg">Help friends reach class on time. Let's list your ride!</p>
              </div>

              <div className="space-y-5">
                <div className="group space-y-2">
                  <label htmlFor="bike-model" className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 group-focus-within:text-indigo-600 transition-colors">Your Bike Model</label>
                  <div className="relative">
                    <input 
                      id="bike-model"
                      type="text" 
                      value={bikeModel}
                      onChange={(e) => setBikeModel(e.target.value)}
                      placeholder="e.g. Activa 6G, Splendor+"
                      className="w-full bg-white border-2 border-slate-100 rounded-3xl p-5 font-bold text-slate-800 focus:border-indigo-600 focus:ring-4 ring-indigo-50 transition-all outline-none shadow-sm pr-14"
                    />
                    {bikeModel.length > 2 && (
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-green-500 animate-in zoom-in" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </div>
                </div>
                <div className="group space-y-2">
                  <label htmlFor="plate-number" className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 group-focus-within:text-indigo-600 transition-colors">License Plate</label>
                  <div className="relative">
                    <input 
                      id="plate-number"
                      type="text" 
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value)}
                      placeholder="e.g. DL 3S AB 1234"
                      className="w-full bg-white border-2 border-slate-100 rounded-3xl p-5 font-bold text-slate-800 focus:border-indigo-600 focus:ring-4 ring-indigo-50 transition-all outline-none shadow-sm pr-14"
                    />
                    {plateNumber.length > 4 && (
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-green-500 animate-in zoom-in" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button 
                disabled={!bikeModel || !plateNumber}
                onClick={nextStep}
                className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-lg italic shadow-2xl shadow-indigo-100 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 focus:ring-4 ring-indigo-200"
              >
                Next: Profile Photo
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-6 text-center">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-slate-800 italic leading-tight tracking-tight">Show Your<br/><span className="text-indigo-600">Face</span></h2>
                <p className="text-slate-500 font-bold px-4 text-sm">Recognition builds trust. Upload a photo or pick an avatar!</p>
              </div>

              {/* Toggle Switcher */}
              <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center max-w-[240px] mx-auto shadow-inner" role="tablist">
                <button 
                  role="tab"
                  aria-selected={avatarMode === 'upload'}
                  onClick={() => setAvatarMode('upload')}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${avatarMode === 'upload' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Upload
                </button>
                <button 
                  role="tab"
                  aria-selected={avatarMode === 'library'}
                  onClick={() => setAvatarMode('library')}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${avatarMode === 'library' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Avatar
                </button>
              </div>

              <div className="relative min-h-[220px] flex items-center justify-center">
                {avatarMode === 'upload' ? (
                  <div className="animate-in fade-in zoom-in-95 duration-300 w-48 h-48 mx-auto">
                    <button 
                      onClick={() => !isUploadingPhoto && fileInputRef.current?.click()}
                      aria-label={profileImage ? "Change profile photo" : "Upload profile photo"}
                      className={`w-full h-full rounded-[3.5rem] bg-slate-50 border-4 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-300 group focus:ring-4 ring-indigo-200
                        ${profileImage && !profileImage.includes('dicebear') ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-indigo-300'}
                      `}
                    >
                      {isUploadingPhoto ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-[10px] font-black text-indigo-600 uppercase">Processing...</span>
                        </div>
                      ) : (profileImage && !profileImage.includes('dicebear')) ? (
                        <div className="relative w-full h-full">
                          <img src={profileImage} alt="Profile preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center animate-in fade-in">
                            <div className="bg-white/90 p-2 rounded-full shadow-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-300 group-hover:text-indigo-400 transition-colors flex flex-col items-center" aria-hidden="true">
                          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                          <span className="text-[10px] font-black uppercase mt-2">Upload Photo</span>
                        </div>
                      )}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                      aria-hidden="true"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 p-2">
                    {AVATAR_OPTIONS.map((avatar) => (
                      <button 
                        key={avatar.id}
                        onClick={() => handleSelectAvatar(avatar.url)}
                        aria-label={`Select student avatar option`}
                        className={`relative w-20 h-20 rounded-[1.5rem] bg-white border-2 transition-all p-1 hover:scale-105 active:scale-95 focus:ring-2 ring-indigo-500
                          ${profileImage === avatar.url ? 'border-indigo-600 shadow-lg shadow-indigo-100 scale-110' : 'border-slate-100 opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'}
                        `}
                      >
                        <img src={avatar.url} alt="" className="w-full h-full object-cover" />
                        {profileImage === avatar.url && (
                          <div className="absolute -top-1 -right-1 bg-indigo-600 text-white p-1 rounded-full border-2 border-white shadow-sm" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <button 
                  onClick={nextStep}
                  className={`w-full py-6 rounded-[2rem] font-black text-lg italic shadow-2xl active:scale-95 transition-all focus:ring-4 ring-indigo-200
                    ${profileImage ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}
                  `}
                >
                  {profileImage ? 'Looks Good!' : 'Skip for Now'}
                </button>
                <button 
                  onClick={prevStep} 
                  className="inline-flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-800 transition-colors focus:underline"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
                  Go Back
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-8 text-center">
              <div className="inline-flex relative" aria-hidden="true">
                <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border-4 border-white transition-all duration-500
                  ${docVerified ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}
                `}>
                  {docVerified ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="m9 11 3-3 3 3"/></svg>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-4xl font-black text-slate-800 italic leading-tight tracking-tight">Campus Safety<br/><span className={docVerified ? 'text-green-500' : 'text-amber-500'}>{docVerified ? 'Verified' : 'First'}</span></h2>
                <p className="text-slate-500 font-bold px-4 text-sm">Upload your student ID or license to help us keep the campus secure.</p>
              </div>
              
              <button 
                className={`relative group h-[280px] w-full border-4 border-dashed rounded-[3rem] flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden focus:ring-4 ring-amber-200
                  ${isScanningDoc ? 'border-indigo-600 bg-indigo-50' : docVerified ? 'border-green-500 bg-green-50/30' : 'border-slate-100 bg-slate-50/50 hover:border-amber-200 hover:bg-amber-50/30'}
                `} 
                aria-label={docVerified ? "Document verified, click to proceed" : "Click to upload student ID or license"}
                onClick={handleSimulateDocUpload}
              >
                {isScanningDoc ? (
                  <div className="space-y-6 text-center z-10" aria-live="polite">
                    <div className="relative mx-auto w-16 h-16">
                      <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] animate-pulse">Scanning Data...</p>
                    </div>
                  </div>
                ) : docVerified ? (
                  <div className="space-y-4 text-center z-10 animate-in zoom-in duration-500">
                    <div className="text-green-500 flex justify-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    </div>
                    <p className="text-sm font-black text-green-600 uppercase tracking-widest">Verification Successful</p>
                  </div>
                ) : (
                  <div className="space-y-4 text-center z-10 px-8" aria-hidden="true">
                    <div className="text-slate-300 group-hover:text-amber-500 transition-colors flex justify-center scale-110 group-hover:scale-125 duration-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Click to Upload</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">Student ID Card / Driving License</p>
                    </div>
                  </div>
                )}
                
                {isScanningDoc && (
                  <div className="absolute inset-x-0 h-1 bg-indigo-400/30 shadow-[0_0_20px_rgba(79,70,229,0.5)] animate-scan z-0" />
                )}
              </button>
              
              <button 
                onClick={prevStep} 
                className="inline-flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-800 transition-colors focus:underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
                Go Back
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-10">
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-black text-slate-800 italic tracking-tight">Rider <span className="text-indigo-600">Protocol</span></h2>
                <p className="text-slate-500 font-bold">Quick rules for a smooth CampusRide.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4" role="list">
                {[
                  { icon: '🚀', title: 'Be Instant', desc: 'Reach pick-up points quickly.', color: 'indigo' },
                  { icon: '💰', title: 'Easy Pay', desc: 'Earnings added directly to wallet.', color: 'amber' },
                  { icon: '🪖', title: 'Helmet Always', desc: 'Safety first. Follow campus limits.', color: 'green' }
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    role="listitem"
                    className="group bg-white p-5 rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all flex items-center gap-5"
                    tabIndex={0}
                  >
                    <div className={`w-14 h-14 bg-${item.color}-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`} aria-hidden="true">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-800 italic text-lg leading-tight">{item.title}</h4>
                      <p className="text-xs text-slate-500 font-bold leading-relaxed">{item.desc}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600" aria-hidden="true">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <button 
                  onClick={nextStep}
                  className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black text-lg shadow-2xl shadow-indigo-100 active:scale-95 transition-all italic focus:ring-4 ring-indigo-200"
                >
                  I'm Ready!
                </button>
                <button 
                  onClick={prevStep} 
                  className="w-full inline-flex items-center justify-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-800 transition-colors focus:underline"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
                  Go Back
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in zoom-in-95 duration-1000 text-center space-y-10">
              <div className="relative">
                <div className="w-40 h-40 bg-green-500 text-white rounded-[3.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-green-200 relative z-10" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="animate-in zoom-in duration-500 delay-300"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div className="absolute inset-0 bg-green-500/20 blur-[50px] rounded-full animate-pulse" />
              </div>

              <div className="space-y-3">
                <h2 className="text-5xl font-black text-slate-800 italic tracking-tighter leading-tight">Registration<br/><span className="text-indigo-600">Complete!</span></h2>
                <p className="text-slate-500 font-bold text-lg max-w-[280px] mx-auto">Welcome to the family, Rider. Your first lift is waiting!</p>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleFinish}
                  className="w-full bg-slate-900 text-white py-7 rounded-[3rem] font-black shadow-2xl active:scale-95 transition-all text-2xl italic tracking-tight focus:ring-4 ring-slate-200"
                >
                  Enter Rider Hub
                </button>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6 animate-pulse" aria-live="polite">Starting Service...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[101]" aria-hidden="true">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-2 h-4 bg-indigo-500 rounded-sm animate-confetti"
              style={{ 
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                backgroundColor: ['#4f46e5', '#f59e0b', '#10b981', '#ef4444'][Math.floor(Math.random() * 4)],
                animationDelay: `${Math.random() * 3}s`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan {
          animation: scan 1.5s linear infinite;
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 4s ease-in infinite;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default OnboardingFlow;

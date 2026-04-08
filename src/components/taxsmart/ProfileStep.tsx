import { useState } from 'react';
import { UserProfile, ChildInfo } from '@/lib/types';
import { User, Heart, Baby, ChevronRight } from 'lucide-react';

interface ProfileStepProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  onNext: () => void;
}

const ProfileStep = ({ profile, onUpdate, onNext }: ProfileStepProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!profile.fullName.trim()) e.fullName = 'Name is required';
    if (!profile.age || profile.age < 18 || profile.age > 120) e.age = 'Valid age required (18-120)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  const updateChildren = (count: number) => {
    const children: ChildInfo[] = Array.from({ length: count }, (_, i) => 
      profile.children[i] || { isMinor: true }
    );
    onUpdate({ ...profile, children });
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <User className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Your Profile</h2>
        <p className="text-muted-foreground text-sm">Personalized strategies start with knowing you</p>
      </div>

      <div className="card-premium p-6 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-foreground">Full Name</label>
          <input
            type="text"
            value={profile.fullName}
            onChange={(e) => onUpdate({ ...profile, fullName: e.target.value })}
            className="input-premium w-full"
            placeholder="Enter your full name"
          />
          {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName}</p>}
        </div>

        {/* Age */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-foreground">Age</label>
          <input
            type="number"
            value={profile.age || ''}
            onChange={(e) => onUpdate({ ...profile, age: parseInt(e.target.value) || 0 })}
            className="input-premium w-full"
            placeholder="e.g. 35"
          />
          {errors.age && <p className="text-destructive text-xs mt-1">{errors.age}</p>}
          {profile.age >= 60 && (
            <p className="text-success text-xs mt-1">✓ Senior citizen benefits applicable</p>
          )}
        </div>

        {/* Residential Status */}
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Residential Status</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'resident', label: 'Resident' },
              { value: 'rnor', label: 'RNOR' },
              { value: 'nri', label: 'NRI' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => onUpdate({ ...profile, residentialStatus: opt.value })}
                className={`p-3 rounded-lg text-sm font-medium transition-all border ${
                  profile.residentialStatus === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Marital Status */}
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Marital Status</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'single', label: 'Single', icon: User },
              { value: 'married', label: 'Married', icon: Heart },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => onUpdate({ ...profile, maritalStatus: opt.value, hasChildren: false, children: [] })}
                className={`p-3 rounded-lg text-sm font-medium transition-all border flex items-center justify-center gap-2 ${
                  profile.maritalStatus === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'
                }`}
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Children - only if married */}
        {profile.maritalStatus === 'married' && (
          <div className="animate-fade-in">
            <label className="block text-sm font-medium mb-2 text-foreground">
              <Baby className="w-4 h-4 inline mr-1" />
              Do you have children?
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => onUpdate({ ...profile, hasChildren: true, children: [{ isMinor: true }] })}
                className={`p-3 rounded-lg text-sm font-medium transition-all border ${
                  profile.hasChildren
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => onUpdate({ ...profile, hasChildren: false, children: [] })}
                className={`p-3 rounded-lg text-sm font-medium transition-all border ${
                  !profile.hasChildren
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'
                }`}
              >
                No
              </button>
            </div>

            {profile.hasChildren && (
              <div className="animate-fade-in space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Number of children</label>
                  <select
                    value={profile.children.length}
                    onChange={(e) => updateChildren(parseInt(e.target.value))}
                    className="input-premium w-full"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                {profile.children.map((child, i) => (
                  <div key={i} className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3">
                    <span className="text-xs text-muted-foreground">Child {i + 1}</span>
                    <div className="flex gap-2 flex-1">
                      <button
                        onClick={() => {
                          const updated = [...profile.children];
                          updated[i] = { isMinor: true };
                          onUpdate({ ...profile, children: updated });
                        }}
                        className={`flex-1 p-2 rounded text-xs font-medium border transition-all ${
                          child.isMinor ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                        }`}
                      >
                        Minor (&lt;18)
                      </button>
                      <button
                        onClick={() => {
                          const updated = [...profile.children];
                          updated[i] = { isMinor: false };
                          onUpdate({ ...profile, children: updated });
                        }}
                        className={`flex-1 p-2 rounded text-xs font-medium border transition-all ${
                          !child.isMinor ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                        }`}
                      >
                        Major (18+)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button onClick={handleNext} className="btn-gold w-full mt-6 flex items-center justify-center gap-2">
        Continue <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ProfileStep;

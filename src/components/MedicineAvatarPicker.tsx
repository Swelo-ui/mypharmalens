
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// New cute cartoon avatars
const avatars = [
  { id: 'avatar-1', src: '/lovable-uploads/d42a8973-1833-4422-99c2-bd70a3f60668.png#sprite=0-0', alt: 'Girl with Red Hair Avatar' },
  { id: 'avatar-2', src: '/lovable-uploads/d42a8973-1833-4422-99c2-bd70a3f60668.png#sprite=1-0', alt: 'Boy with Blue Shirt Avatar' },
  { id: 'avatar-3', src: '/lovable-uploads/d42a8973-1833-4422-99c2-bd70a3f60668.png#sprite=2-0', alt: 'Girl with Pigtails Avatar' },
  { id: 'avatar-4', src: '/lovable-uploads/d42a8973-1833-4422-99c2-bd70a3f60668.png#sprite=3-0', alt: 'Boy with Glasses Avatar' },
  { id: 'avatar-5', src: '/lovable-uploads/d42a8973-1833-4422-99c2-bd70a3f60668.png#sprite=0-1', alt: 'Red Hair Boy Avatar' },
  { id: 'avatar-6', src: '/lovable-uploads/d42a8973-1833-4422-99c2-bd70a3f60668.png#sprite=1-1', alt: 'Sad Boy Avatar' },
  { id: 'avatar-7', src: '/lovable-uploads/d42a8973-1833-4422-99c2-bd70a3f60668.png#sprite=2-1', alt: 'Asian Girl Avatar' },
  { id: 'avatar-8', src: '/lovable-uploads/d42a8973-1833-4422-99c2-bd70a3f60668.png#sprite=3-1', alt: 'Boy with Blue Glasses Avatar' },
  { id: 'avatar-9', src: '/lovable-uploads/d42a8973-1833-4422-99c2-bd70a3f60668.png#sprite=0-2', alt: 'Boy with Cap Avatar' },
  { id: 'avatar-10', src: '/lovable-uploads/d42a8973-1833-4422-99c2-bd70a3f60668.png#sprite=1-2', alt: 'Girl with Hair Buns Avatar' },
  { id: 'avatar-11', src: '/lovable-uploads/d42a8973-1833-4422-99c2-bd70a3f60668.png#sprite=2-2', alt: 'Girl with Purple Hair Avatar' },
  { id: 'avatar-12', src: '/lovable-uploads/d42a8973-1833-4422-99c2-bd70a3f60668.png#sprite=3-2', alt: 'Boy with Curly Hair Avatar' },
  { id: 'avatar-13', src: '/lovable-uploads/d42a8973-1833-4422-99c2-bd70a3f60668.png#sprite=0-3', alt: 'Girl with Black Hair Avatar' },
  { id: 'avatar-14', src: '/lovable-uploads/d42a8973-1833-4422-99c2-bd70a3f60668.png#sprite=1-3', alt: 'Boy with Short Hair Avatar' },
  { id: 'avatar-15', src: '/lovable-uploads/d42a8973-1833-4422-99c2-bd70a3f60668.png#sprite=2-3', alt: 'Boy with Fade Haircut Avatar' },
  { id: 'avatar-16', src: '/lovable-uploads/d42a8973-1833-4422-99c2-bd70a3f60668.png#sprite=3-3', alt: 'Boy with Yellow Cap Avatar' },
];

interface MedicineAvatarPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const MedicineAvatarPicker = ({ value, onChange }: MedicineAvatarPickerProps) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-4">Choose an Avatar</h3>
      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-4 gap-4">
        {avatars.map((avatar) => (
          <div key={avatar.id} className="flex flex-col items-center gap-2">
            <Label
              htmlFor={avatar.id}
              className={`cursor-pointer rounded-full p-1 flex items-center justify-center ${
                value === avatar.id ? 'ring-2 ring-[#0384c6]' : 'hover:ring-2 hover:ring-gray-300'
              }`}
            >
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatar.src} alt={avatar.alt} className="object-cover" />
                <AvatarFallback>{avatar.alt.charAt(0)}</AvatarFallback>
              </Avatar>
            </Label>
            <RadioGroupItem
              value={avatar.id}
              id={avatar.id}
              className="sr-only"
            />
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default MedicineAvatarPicker;

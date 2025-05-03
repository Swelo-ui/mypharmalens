
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Medicine avatar options
const medicineAvatars = [
  { id: 'pill-blue', src: '/lovable-uploads/0c37ed0c-2fd6-4344-9c87-2deb2ce28ac6.png', alt: 'Blue Pill Avatar' },
  { id: 'pill-red', src: '/lovable-uploads/7f661aae-5eba-4e72-bd24-0e791d37ab5d.png', alt: 'Red Pill Avatar' },
  { id: 'pill-green', src: '/lovable-uploads/85cbd19d-4eb1-48a3-b5ea-053e257ddac5.png', alt: 'Green Pill Avatar' },
  { id: 'pill-yellow', src: '/lovable-uploads/b0f69091-6398-44ec-ab75-fbdd269964e4.png', alt: 'Yellow Pill Avatar' },
  { id: 'pill-orange', src: '/lovable-uploads/e598b849-9cf5-4101-8deb-b478c474baef.png', alt: 'Orange Pill Avatar' },
  { id: 'capsule', src: 'https://img.icons8.com/?size=96&id=115496&format=png', alt: 'Capsule Avatar' },
  { id: 'syringe', src: 'https://img.icons8.com/?size=96&id=118289&format=png', alt: 'Syringe Avatar' },
  { id: 'stethoscope', src: 'https://img.icons8.com/?size=96&id=43755&format=png', alt: 'Stethoscope Avatar' },
  { id: 'first-aid', src: 'https://img.icons8.com/?size=96&id=43859&format=png', alt: 'First Aid Avatar' },
];

interface MedicineAvatarPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const MedicineAvatarPicker = ({ value, onChange }: MedicineAvatarPickerProps) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-4">Choose an Avatar</h3>
      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-3 md:grid-cols-5 gap-4">
        {medicineAvatars.map((avatar) => (
          <div key={avatar.id} className="flex flex-col items-center gap-2">
            <Label
              htmlFor={`avatar-${avatar.id}`}
              className={`cursor-pointer rounded-full p-1 flex items-center justify-center ${
                value === avatar.id ? 'ring-2 ring-[#0384c6]' : 'hover:ring-2 hover:ring-gray-300'
              }`}
            >
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatar.src} alt={avatar.alt} />
                <AvatarFallback>{avatar.alt.charAt(0)}</AvatarFallback>
              </Avatar>
            </Label>
            <RadioGroupItem
              value={avatar.id}
              id={`avatar-${avatar.id}`}
              className="sr-only"
            />
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default MedicineAvatarPicker;

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useScreenshot } from 'use-react-screenshot';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { saveDrugIdentification } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import DrugIdentificationResults from '@/components/DrugIdentificationResults';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const DrugIdentify = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStatus();
  const [image, setImage] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [identificationName, setIdentificationName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const ref = useRef(null);
  const [screenshot, takeScreenshot] = useScreenshot();

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResults(null);
        setError(null);
        setDescription('');
        setShowSaveButton(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  const handleIdentify = async () => {
    if (!image) {
      toast.error('Please upload an image first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', dataURLtoFile(image, 'image.png'));

      const response = await fetch('https://api.logick.app/ai/identify-medicine', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData && responseData.drugs && Array.isArray(responseData.drugs)) {
        setResults(responseData.drugs);
        setDescription(responseData.description || '');
        setShowSaveButton(true);
        toast.success('Medication identified successfully!');
      } else {
        setError('No drugs found in the image.');
        setResults(null);
        setShowSaveButton(false);
      }
    } catch (e: any) {
      console.error("Identification error:", e);
      setError(`Identification failed: ${e.message}`);
      setResults(null);
      setShowSaveButton(false);
      toast.error(`Identification failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const dataURLtoFile = (dataurl: string, filename: string) => {
    let arr = dataurl.split(','),
      mime = arr[0].match(/:(.*?);/)?.[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const handleSaveIdentification = async () => {
    if (!isAuthenticated) {
      toast.info('You must be logged in to save identifications.');
      navigate('/auth');
      return;
    }

    setShowNameInput(true);
  };

  const confirmSaveIdentification = async () => {
    if (!identificationName.trim()) {
      toast.error('Please enter a name for this identification.');
      return;
    }

    setIsSaving(true);

    try {
      const capturedScreenshot = await takeScreenshot(ref.current);

      const identificationData = {
        user_id: (isAuthenticated) ? (JSON.parse(localStorage.getItem('supabase.auth.token') || '{}')?.currentSession?.user?.id) : null,
        name: identificationName,
        image_url: image,
        results: JSON.stringify(results),
        description: description,
        screenshot_url: capturedScreenshot,
      };

      await saveDrugIdentification(identificationData);

      toast.success('Identification saved successfully!');
      setShowNameInput(false);
      setIdentificationName('');
    } catch (e: any) {
      console.error("Error saving identification:", e);
      toast.error(`Failed to save identification: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container max-w-5xl mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Identify Medication</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Upload an image or describe the medication to identify it.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
          <div className="w-full max-w-md">
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <label
              htmlFor="image-upload"
              className="w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg py-12 px-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="flex flex-col items-center justify-center">
                <Camera className="h-6 w-6 text-gray-500 dark:text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {image ? 'Change Image' : 'Upload an Image'}
                </p>
              </div>
            </label>
            {image && (
              <div className="mt-4">
                <img
                  src={image}
                  alt="Uploaded Medication"
                  className="w-full rounded-lg shadow-md"
                />
              </div>
            )}
          </div>

          <div className="w-full max-w-md">
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Medication Description
            </Label>
            <textarea
              id="description"
              rows={4}
              className="shadow-sm focus:ring-pharma-500 focus:border-pharma-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              placeholder="Enter a description of the medication (e.g., color, shape, markings)"
              value={description}
              onChange={handleDescriptionChange}
            />
          </div>
        </div>

        <div className="text-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleIdentify}
            disabled={loading || !image}
          >
            {loading ? (
              <>
                Identifying...
              </>
            ) : (
              'Identify Medication'
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-6 text-center text-red-500">
            {error}
          </div>
        )}

        {results && results.length > 0 && (
          <div className="mt-8">
            <div ref={ref}>
              <DrugIdentificationResults results={results} />
              {description && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">AI Analysis:</h3>
                  <p className={cn("text-gray-700 dark:text-gray-300", isDescriptionExpanded ? "" : "line-clamp-3")}>
                    {description}
                  </p>
                  {description.length > 100 && (
                    <button onClick={toggleDescription} className="text-pharma-500 hover:text-pharma-700 focus:outline-none">
                      {isDescriptionExpanded ? "Show Less" : "Show More"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {showSaveButton && (
              <div className="mt-6 text-center">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleSaveIdentification}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Identification'}
                </Button>
              </div>
            )}
          </div>
        )}

        {showNameInput && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative p-4 w-full max-w-md h-auto">
              <div className="bg-white rounded-lg shadow dark:bg-gray-700">
                <div className="flex justify-between items-center p-5 rounded-t border-b dark:border-gray-600">
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                    Save Identification
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                    onClick={() => setShowNameInput(false)}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <Label htmlFor="identification-name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Identification Name
                  </Label>
                  <Input
                    type="text"
                    id="identification-name"
                    placeholder="Enter a name for this identification"
                    className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
                    value={identificationName}
                    onChange={(e) => setIdentificationName(e.target.value)}
                  />
                </div>
                <div className="flex items-center p-6 space-x-2 rounded-b border-t dark:border-gray-600">
                  <Button
                    variant="primary"
                    onClick={confirmSaveIdentification}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Confirm Save'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowNameInput(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DrugIdentify;

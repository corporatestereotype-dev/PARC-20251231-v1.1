

import React, { useState } from 'react';
import { generateImage } from '../lib/ai';
import type { Settings } from '../types';

interface ProjectFormProps {
  onAddProject: (project: { title: string; description: string; imageUrl: string | null; tags: string[] }) => Promise<void>;
  settings: Settings;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onAddProject, settings }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenError, setImageGenError] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!title && !description) return;
    setIsGeneratingImage(true);
    setImageUrl(null);
    setImageGenError(null);
    try {
      const prompt = `A professional, abstract, visually appealing banner for a research project titled "${title}". The project is about: ${description}. Style: minimalist, digital art, high-tech.`;
      const generatedUrl = await generateImage(prompt, settings);
      setImageUrl(generatedUrl);
    } catch (error) {
      console.error("Failed to generate image", error);
      setImageGenError("Image generation failed. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);
    await onAddProject({ title, description, imageUrl, tags });
    setTitle('');
    setDescription('');
    setTagsInput('');
    setImageUrl(null);
  };

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Create a New Project</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">Project Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g., AI for Climate Change Modeling"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">Project Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Briefly describe your project, its goals, and methodology."
            required
          ></textarea>
        </div>
         <div>
            <label htmlFor="tags" className="block text-sm font-medium text-slate-300 mb-2">Project Tags</label>
            <input
                type="text"
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g., computer-vision, pytorch, dataset"
            />
            <p className="text-xs text-slate-500 mt-1">Comma-separated tags.</p>
        </div>
         <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Project Image</label>
            <div className="bg-slate-700/50 p-4 rounded-md border border-slate-600">
                {(imageUrl && !isGeneratingImage) && (
                    <div className="mb-4">
                        <img src={imageUrl} alt="Generated project preview" className="rounded-md w-full aspect-video object-cover"/>
                    </div>
                )}
                {isGeneratingImage && (
                    <div className="flex items-center justify-center h-40 bg-slate-800 rounded-md mb-4">
                        <svg className="animate-spin h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="ml-3 text-slate-400">Generating image...</p>
                    </div>
                )}
                {imageGenError && <p className="text-red-400 text-sm mb-2 text-center">{imageGenError}</p>}
                <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage || (!title.trim() && !description.trim()) || settings.aiProvider !== 'gemini'}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isGeneratingImage ? 'Generating...' : 'Generate Project Image with AI'}
                </button>
                <p className="text-xs text-slate-500 mt-2 text-center">
                    {settings.aiProvider === 'gemini' 
                        ? 'Uses the project title and description as a prompt.'
                        : 'Image generation is only available with Gemini.'
                    }
                </p>
            </div>
        </div>
        <div>
           <label htmlFor="file-upload" className="block text-sm font-medium text-slate-300 mb-2">Project Files (e.g., PDF, Slides)</label>
           <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md">
             <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <div className="flex text-sm text-slate-400">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-slate-700 rounded-md font-medium text-blue-400 hover:text-blue-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-800 focus-within:ring-blue-500 px-1">
                        <span>Upload to configured storage</span>
                         <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
                    </label>
                </div>
                 <p className="text-xs text-slate-500">(This is a mock upload)</p>
             </div>
           </div>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          Create Project
        </button>
      </form>
    </div>
  );
};

export default ProjectForm;
import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const SettingsPage = () => {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold">Settings</h1>

            <Card>
                <h2 className="text-xl font-bold border-b border-surface2 pb-4 mb-4">API Keys & Integrations</h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-primary-muted mb-1">Google Sign-In</label>
                        <p className="text-sm">Connected as user@example.com</p>
                    </div>
                    <div>
                        <label htmlFor="gemini-key" className="block text-sm font-medium text-primary-muted mb-1">Gemini API Key</label>
                        <input id="gemini-key" type="password" value="••••••••••••••••••••••••••••••••" readOnly className="w-full bg-background border border-surface2 rounded-lg p-2" />
                    </div>
                    <div>
                        <label htmlFor="gemini-model" className="block text-sm font-medium text-primary-muted mb-1">Gemini Model</label>
                        <select id="gemini-model" className="w-full bg-background border border-surface2 rounded-lg p-2 focus:ring-accent-violet focus:border-accent-violet">
                            <option>gemini-2.5-pro</option>
                            <option>gemini-2.5-flash</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-primary-muted mb-1">Default Testing Framework</label>
                        <div className="flex space-x-4">
                            <label className="flex items-center"><input type="radio" name="framework" defaultChecked className="text-accent-violet mr-2 bg-surface2 border-surface2"/> Jest</label>
                            <label className="flex items-center"><input type="radio" name="framework" className="text-accent-violet mr-2 bg-surface2 border-surface2"/> PyTest</label>
                            <label className="flex items-center"><input type="radio" name="framework" className="text-accent-violet mr-2 bg-surface2 border-surface2"/> xUnit</label>
                        </div>
                    </div>
                </div>
            </Card>
            
            <Card>
                <h2 className="text-xl font-bold border-b border-surface2 pb-4 mb-4">Preferences</h2>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="theme" className="block text-sm font-medium text-primary-muted mb-1">Theme</label>
                        <select id="theme" className="w-full bg-background border border-surface2 rounded-lg p-2 focus:ring-accent-violet focus:border-accent-violet">
                            <option>Dark</option>
                            <option disabled>Light (Coming Soon)</option>
                        </select>
                    </div>
                </div>
            </Card>

            <div className="flex justify-end">
                <Button>Save Changes</Button>
            </div>
        </div>
    );
};

export default SettingsPage;

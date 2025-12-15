import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Download, ChevronLeft, ChevronRight, Image as ImageIcon, FileText } from 'lucide-react';

export default function MediaGallery({ messages, isOpen, onClose }) {
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Extract all media from messages
    const allMedia = messages
        .filter(msg => msg.file_urls && msg.file_urls.length > 0)
        .flatMap(msg =>
            msg.file_urls.map(url => ({
                url,
                messageId: msg.id,
                userName: msg.user_name,
                date: msg.created_date,
                isImage: url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
            }))
        );

    const images = allMedia.filter(m => m.isImage);
    const files = allMedia.filter(m => !m.isImage);

    const openLightbox = (media, index) => {
        setSelectedMedia(media);
        setCurrentIndex(index);
    };

    const closeLightbox = () => {
        setSelectedMedia(null);
    };

    const navigateMedia = (direction) => {
        const mediaList = selectedMedia.isImage ? images : files;
        const newIndex = (currentIndex + direction + mediaList.length) % mediaList.length;
        setCurrentIndex(newIndex);
        setSelectedMedia(mediaList[newIndex]);
    };

    const downloadMedia = (url) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = url.split('/').pop();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl bg-zinc-900 border-zinc-800 p-0">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Media Gallery</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <Tabs defaultValue="images" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
                                <TabsTrigger value="images" className="data-[state=active]:bg-indigo-600">
                                    <ImageIcon className="w-4 h-4 mr-2" />
                                    Images ({images.length})
                                </TabsTrigger>
                                <TabsTrigger value="files" className="data-[state=active]:bg-indigo-600">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Files ({files.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="images" className="mt-4">
                                {images.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No images shared yet</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2">
                                        {images.map((media, index) => (
                                            <div
                                                key={index}
                                                className="relative group cursor-pointer aspect-square rounded-lg overflow-hidden border border-zinc-700 hover:border-indigo-500 transition-colors"
                                                onClick={() => openLightbox(media, index)}
                                            >
                                                <img
                                                    src={media.url}
                                                    alt="Shared media"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ImageIcon className="w-8 h-8 text-white" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="files" className="mt-4">
                                {files.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No files shared yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                        {files.map((media, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-indigo-500 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                                                        <FileText className="w-5 h-5 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white text-sm font-medium truncate max-w-[300px]">
                                                            {media.url.split('/').pop()}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            Shared by {media.userName}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => downloadMedia(media.url)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Lightbox for images */}
            {selectedMedia && selectedMedia.isImage && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 text-white hover:bg-white/10"
                    >
                        <X className="w-6 h-6" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigateMedia(-1)}
                        className="absolute left-4 text-white hover:bg-white/10"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigateMedia(1)}
                        className="absolute right-4 text-white hover:bg-white/10"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </Button>

                    <div className="max-w-4xl max-h-[80vh] p-4">
                        <img
                            src={selectedMedia.url}
                            alt="Lightbox"
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />
                        <div className="text-center mt-4">
                            <p className="text-white text-sm">
                                Shared by {selectedMedia.userName}
                            </p>
                            <p className="text-slate-400 text-xs mt-1">
                                {currentIndex + 1} / {images.length}
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        className="absolute bottom-4 right-4 text-white hover:bg-white/10"
                        onClick={() => downloadMedia(selectedMedia.url)}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                    </Button>
                </div>
            )}
        </>
    );
}

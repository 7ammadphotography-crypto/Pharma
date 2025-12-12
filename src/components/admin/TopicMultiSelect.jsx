import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, Check } from 'lucide-react';
import { 
  Heart, Brain, Pill, Syringe, Stethoscope, Microscope, 
  FlaskConical, ClipboardList, Shield, Users, Scale, Activity,
  Thermometer, Eye, Ear, Hand, Wind, Bone, Droplet, Dna
} from 'lucide-react';

const TOPIC_ICONS = {
  heart: Heart, brain: Brain, pill: Pill, syringe: Syringe,
  stethoscope: Stethoscope, microscope: Microscope, flask: FlaskConical,
  clipboard: ClipboardList, shield: Shield, users: Users, scale: Scale,
  activity: Activity, thermometer: Thermometer, eye: Eye, ear: Ear,
  hand: Hand, lungs: Wind, bone: Bone, droplet: Droplet, dna: Dna
};

export default function TopicMultiSelect({ 
  topics = [], 
  competencies = [], 
  selectedTopicIds = [], 
  onChange 
}) {
  const [search, setSearch] = useState('');

  const groupedTopics = useMemo(() => {
    const groups = {};
    competencies.forEach(comp => {
      groups[comp.id] = {
        competency: comp,
        topics: topics.filter(t => t.competency_id === comp.id)
      };
    });
    return Object.values(groups).filter(g => g.topics.length > 0);
  }, [topics, competencies]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groupedTopics;
    const s = search.toLowerCase();
    return groupedTopics.map(g => ({
      ...g,
      topics: g.topics.filter(t => 
        t.title.toLowerCase().includes(s) || 
        g.competency.title.toLowerCase().includes(s)
      )
    })).filter(g => g.topics.length > 0);
  }, [groupedTopics, search]);

  const toggleTopic = (topicId) => {
    if (selectedTopicIds.includes(topicId)) {
      onChange(selectedTopicIds.filter(id => id !== topicId));
    } else {
      onChange([...selectedTopicIds, topicId]);
    }
  };

  const removeTopic = (topicId) => {
    onChange(selectedTopicIds.filter(id => id !== topicId));
  };

  const selectedTopics = topics.filter(t => selectedTopicIds.includes(t.id));

  return (
    <div className="space-y-3">
      {/* Selected Topics */}
      {selectedTopics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTopics.map(topic => {
            const Icon = TOPIC_ICONS[topic.icon] || Pill;
            return (
              <Badge 
                key={topic.id} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 pr-1"
              >
                <Icon className="w-3 h-3" />
                <span className="max-w-[100px] truncate">{topic.title}</span>
                <button 
                  onClick={() => removeTopic(topic.id)}
                  className="ml-1 hover:bg-white/20 rounded p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input 
          placeholder="Search for topic..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-zinc-800 border-zinc-700 pr-10"
        />
      </div>

      {/* Topic List */}
      <ScrollArea className="h-[200px] border border-zinc-700 rounded-lg">
        <div className="p-2 space-y-3">
          {filteredGroups.map(group => (
            <div key={group.competency.id}>
              <div className="text-xs text-slate-500 font-medium px-2 py-1 sticky top-0 bg-zinc-900">
                {group.competency.title}
              </div>
              <div className="space-y-0.5">
                {group.topics.map(topic => {
                  const Icon = TOPIC_ICONS[topic.icon] || Pill;
                  const isSelected = selectedTopicIds.includes(topic.id);
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => toggleTopic(topic.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-right transition-all ${
                        isSelected 
                          ? 'bg-indigo-600/30 text-white ring-1 ring-indigo-500' 
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${isSelected ? 'bg-indigo-600' : 'bg-zinc-700'}`}>
                        {isSelected ? <Check className="w-4 h-4 text-white" /> : <Icon className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-sm flex-1 truncate">{topic.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {filteredGroups.length === 0 && (
            <p className="text-center text-slate-500 py-4 text-sm">No results found</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
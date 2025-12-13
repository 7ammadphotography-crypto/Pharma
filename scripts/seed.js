
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });


const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing server-side env vars.');
    console.error('Required: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}


const supabase = createClient(supabaseUrl, supabaseKey);

const COMPETENCIES = [
    { title: 'Biomedical Sciences', description: 'Core scientific principles', icon: 'beaker', color: 'blue', weight: 40, order: 1 },
    { title: 'Pharmaceutical Sciences', description: 'Drug delivery and formulation', icon: 'pill', color: 'purple', weight: 30, order: 2 },
    { title: 'Pharmacy Practice', description: 'Clinical and professional practice', icon: 'stethoscope', color: 'green', weight: 30, order: 3 },
];

const TOPICS_MAP = {
    'Biomedical Sciences': ['Physiology', 'Biochemistry'],
    'Pharmaceutical Sciences': ['Pharmacokinetics', 'Toxicology'],
    'Pharmacy Practice': ['Cardiology', 'Infectious Diseases', 'Oncology', 'Neurology']
};

const SAMPLE_CASES = [
    {
        title: 'Hypertensive Crisis',
        case_text: 'A 55-year-old male presents with BP 180/120. He has a history of non-adherence to hypertensive medication. He complains of severe headache and blurred vision.',
        case_type: 'clinical',
        difficulty: 'hard',
        related_topic: 'Cardiology'
    },
    {
        title: 'Community Acquired Pneumonia',
        case_text: 'A 65-year-old female presents with fever, cough with productive rusty sputum, and shortness of breath. Chest X-ray confirms consolidation in the right lower lobe.',
        case_type: 'clinical',
        difficulty: 'medium',
        related_topic: 'Infectious Diseases'
    },
    {
        title: 'Chemotherapy Induced Nausea',
        case_text: 'A 45-year-old female undergoing AC regimen for breast cancer complains of severe nausea 24 hours after infusion despite taking ondansetron.',
        case_type: 'management',
        difficulty: 'medium',
        related_topic: 'Oncology'
    }
];

const QUESTION_TEMPLATES = [
    { text: 'Which is the mechanism of action for class [X] drugs?', diff: 'medium' },
    { text: 'What is the first-line treatment for [X]?', diff: 'easy' },
    { text: 'Which side effect is most associated with [X]?', diff: 'medium' },
    { text: 'Calculate the creatinine clearance for a patient on [X].', diff: 'hard' },
    { text: 'Which drug-drug interaction is significant for [X]?', diff: 'hard' }
];

async function seed() {
    console.log('🌱 Starting Database Seed (Expanded)...');

    // 1. Upsert Competencies (Chapters)
    console.log('Creating Competencies...');
    // Map to include both title and name to satisfy potential legacy schema
    const compPayload = COMPETENCIES.map(c => ({
        ...c,
        name: c.title // Fallback for 'name' column
    }));

    const { data: comps, error: compError } = await supabase
        .from('competencies')
        .upsert(compPayload, { onConflict: 'title' })
        .select();

    if (compError) throw compError;
    console.log(`✅ Created ${comps.length} Competencies`);

    // 2. Upsert Topics
    let allTopics = [];
    for (const comp of comps) {
        // Handle both name and title from returned object (in case DB returned one or other)
        const compTitle = comp.title || comp.name;
        const topicNames = TOPICS_MAP[compTitle] || [];

        const topicsPayload = topicNames.map((t, i) => ({
            title: t,
            name: t, // Fallback for 'name' column
            competency_id: comp.id,
            order: i + 1,
            description: `Study of ${t}`
        }));

        if (topicsPayload.length > 0) {
            const { data: createdTopics, error: tError } = await supabase
                .from('topics')
                .upsert(topicsPayload, { onConflict: 'title' })
                .select();

            if (tError) throw tError;
            allTopics = [...allTopics, ...createdTopics];
        }
    }
    console.log(`✅ Created ${allTopics.length} Topics`);

    // 3. Create Cases
    let allCases = [];
    for (const caseData of SAMPLE_CASES) {
        const topic = allTopics.find(t => t.title === caseData.related_topic);
        const { related_topic, ...payload } = caseData;

        const { data: newCase, error: cError } = await supabase
            .from('cases')
            .upsert({ ...payload, topic_id: topic?.id }, { onConflict: 'title' }) // Upsert by title if possible, or just insert
            .select()
            .single();

        if (!cError) allCases.push(newCase);
        else console.warn(`⚠️ Case error (${caseData.title}): ${cError.message}`);
    }
    console.log(`✅ Created ${allCases.length} Cases`);

    // 4. Create Questions (Goal: ~30)
    const QUESTIONS_PER_TOPIC = 5;
    const questionsToInsert = [];
    const topicLinks = [];

    for (const topic of allTopics) {
        for (let i = 0; i < QUESTIONS_PER_TOPIC; i++) {
            const template = QUESTION_TEMPLATES[i % QUESTION_TEMPLATES.length];
            const qText = template.text.replace('[X]', `${topic.title} context ${i + 1}`);
            const relatedCase = allCases.find(c => c.topic_id === topic.id);

            // Link some questions to cases
            const useCase = (i === 4 && relatedCase); // Every 5th question uses a case if available

            questionsToInsert.push({
                question_text: qText,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correct_answer: Math.floor(Math.random() * 4),
                difficulty: template.diff,
                explanation: `Explanation for ${qText}. The correct answer is derived from principles of ${topic.title}.`,
                case_id: useCase ? relatedCase.id : null,
                tags: [topic.title.toLowerCase(), template.diff]
            });
        }
    }

    console.log(`Creating ${questionsToInsert.length} Questions...`);
    // Insert in chunks to be safe, but 30 is small enough for one go
    const { data: createdQuestions, error: qError } = await supabase
        .from('questions')
        .insert(questionsToInsert)
        .select();

    if (qError) throw qError;
    console.log(`✅ Created ${createdQuestions.length} Questions`);

    // 5. Link Questions to Topics
    const topicQuestionsPayload = [];

    // Naive linking: We generated questions by iterating topics, but bulk insert result doesn't guarantee order mapping easily without extra logic.
    // Strategy: We included the topic name in the "tags" or "question_text" to recover it, OR we simply link randomly for this demo seed.
    // Better: Let's fetch questions and link them based on their content tags which we set.

    for (const q of createdQuestions) {
        // Find topic from tag
        const topicTag = q.tags.find(tag => allTopics.some(t => t.title.toLowerCase() === tag));
        const topic = allTopics.find(t => t.title.toLowerCase() === topicTag);

        if (topic) {
            topicQuestionsPayload.push({
                question_id: q.id,
                topic_id: topic.id
            });
        }
    }

    if (topicQuestionsPayload.length > 0) {
        const { error: linkError } = await supabase
            .from('topic_questions')
            .insert(topicQuestionsPayload);

        if (linkError) throw linkError;
        console.log(`✅ Linked ${topicQuestionsPayload.length} Questions to Topics`);
    }

    console.log('🎉 Expanded Seed Complete!');
}

seed().catch(e => {
    console.error('❌ Seed Failed:', e);
    process.exit(1);
});

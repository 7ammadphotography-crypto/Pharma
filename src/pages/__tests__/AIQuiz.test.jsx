import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AIQuiz from '../AIQuiz';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

// Mock dependencies
vi.mock('@/api/base44Client', () => ({
    base44: {
        entities: {
            Topic: { filter: vi.fn() },
            Competency: { filter: vi.fn() }
        },
        integrations: {
            Core: { InvokeLLM: vi.fn() }
        }
    }
}));

// Mock ResizeObserver for Recharts or other UI libs if needed (often needed in jsdom)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

window.fetch = vi.fn();

const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const renderWithProviders = (ui) => {
    const client = createTestQueryClient();
    return render(
        <QueryClientProvider client={client}>
            <BrowserRouter>
                {ui}
            </BrowserRouter>
        </QueryClientProvider>
    );
};

describe('AIQuiz Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading state initially', () => {
        // Mock topic response to trigger enabled query
        base44.entities.Topic.filter.mockResolvedValue([{ id: '123', title: 'Test Topic' }]);

        renderWithProviders(<AIQuiz />);
        expect(screen.getByText(/AI is generating questions/i)).toBeInTheDocument();
    });

    it('renders questions after generation', async () => {
        // Setup mocks
        base44.entities.Topic.filter.mockResolvedValue([{ id: '123', title: 'Test Topic' }]);
        base44.integrations.Core.InvokeLLM.mockResolvedValue({
            questions: [
                {
                    question_text: "What is 2+2?",
                    options: ["3", "4", "5", "6"],
                    correct_answer: 1,
                    difficulty: "easy"
                }
            ]
        });

        renderWithProviders(<AIQuiz />);

        // Wait for questions to load
        await waitFor(() => {
            expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
        });

        expect(screen.getByText("4")).toBeInTheDocument();
    });

    it('handles answer selection correctly', async () => {
        base44.entities.Topic.filter.mockResolvedValue([{ id: '123', title: 'Test Topic' }]);
        base44.integrations.Core.InvokeLLM.mockResolvedValue({
            questions: [
                {
                    question_text: "What is the capital of France?",
                    options: ["London", "Berlin", "Paris", "Madrid"],
                    correct_answer: 2,
                    difficulty: "easy"
                }
            ]
        });

        renderWithProviders(<AIQuiz />);

        await waitFor(() => {
            expect(screen.getByText("Paris")).toBeInTheDocument();
        });

        // Click the correct answer
        fireEvent.click(screen.getByText("Paris"));

        // Should show success message
        await waitFor(() => {
            expect(screen.getByText(/Excellent! You got it right!/i)).toBeInTheDocument();
        });
    });
});

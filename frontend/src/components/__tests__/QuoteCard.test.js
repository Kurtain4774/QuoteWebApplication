import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuoteCard from '../QuoteCard';

const sampleQuote = {
  _id: 'abc123',
  text: 'Not all those who wander are lost.',
  author: 'J.R.R. Tolkien',
  tags: ['wisdom', 'travel'],
  savedBy: [],
  isSaved: false,
  savedCount: 0,
};

describe('QuoteCard', () => {
  test('renders text, author, and tags', () => {
    render(<QuoteCard quote={sampleQuote} variant="owned" />);
    expect(screen.getByText(/not all those who wander are lost/i)).toBeInTheDocument();
    expect(screen.getByText(/Tolkien/)).toBeInTheDocument();
    expect(screen.getByText('#wisdom')).toBeInTheDocument();
    expect(screen.getByText('#travel')).toBeInTheDocument();
  });

  test('owned variant shows a delete button', () => {
    render(<QuoteCard quote={sampleQuote} variant="owned" />);
    expect(screen.getByRole('button', { name: /delete quote/i })).toBeInTheDocument();
  });

  test('explorer variant shows a save button that calls onAction', async () => {
    const onAction = jest.fn().mockResolvedValue();
    render(<QuoteCard quote={sampleQuote} variant="explorer" onAction={onAction} />);

    const saveButton = screen.getByRole('button', { name: /save quote/i });
    await userEvent.click(saveButton);

    expect(onAction).toHaveBeenCalledWith('abc123');
  });

  test('explorer variant shows "Unsave" when isSaved is true', () => {
    render(
      <QuoteCard
        quote={{ ...sampleQuote, isSaved: true }}
        variant="explorer"
      />
    );
    expect(screen.getByRole('button', { name: /unsave quote/i })).toBeInTheDocument();
  });
});

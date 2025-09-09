import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
} from '@/components/ui/Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    render(<Card data-testid="card">Default Card</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('bg-white', 'border', 'border-gray-200', 'shadow-sm');
  });

  it('applies shadow variant styles', () => {
    render(
      <Card variant="shadow" data-testid="card">
        Shadow Card
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('shadow-lg');
  });

  it('applies bordered variant styles', () => {
    render(
      <Card variant="bordered" data-testid="card">
        Bordered Card
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('border-2', 'border-gray-300');
  });

  it('applies ghost variant styles', () => {
    render(
      <Card variant="ghost" data-testid="card">
        Ghost Card
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('bg-transparent');
  });

  it('handles hover effects when hoverable', () => {
    render(
      <Card hoverable data-testid="card">
        Hoverable Card
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('hover:shadow-xl', 'hover:scale-[1.01]', 'cursor-pointer');
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(
      <Card onClick={handleClick} data-testid="card">
        Clickable Card
      </Card>
    );

    await user.click(screen.getByTestId('card'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(
      <Card className="custom-class" data-testid="card">
        Custom Card
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-class');
  });

  it('combines multiple props correctly', () => {
    render(
      <Card variant="shadow" hoverable data-testid="card">
        Complex Card
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('shadow-lg', 'hover:shadow-xl', 'cursor-pointer');
  });
});

describe('Card Sub-components', () => {
  it('renders CardHeader correctly', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('renders CardTitle correctly', () => {
    render(<CardTitle>Title content</CardTitle>);
    const title = screen.getByText('Title content');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-lg', 'font-semibold');
  });

  it('renders CardDescription correctly', () => {
    render(<CardDescription>Description content</CardDescription>);
    const description = screen.getByText('Description content');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('text-sm', 'text-gray-600');
  });

  it('renders CardBody correctly', () => {
    render(<CardBody>Body content</CardBody>);
    const body = screen.getByText('Body content');
    expect(body).toBeInTheDocument();
    expect(body).toHaveClass('px-6', 'py-4');
  });

  it('renders CardFooter correctly', () => {
    render(<CardFooter>Footer content</CardFooter>);
    const footer = screen.getByText('Footer content');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('px-6', 'py-4', 'border-t');
  });

  it('renders complete card with all components', () => {
    render(
      <Card variant="shadow">
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardBody>Test Body</CardBody>
        <CardFooter>Test Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Test Body')).toBeInTheDocument();
    expect(screen.getByText('Test Footer')).toBeInTheDocument();
  });
});

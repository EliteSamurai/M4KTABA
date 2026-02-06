'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
  Search,
  SortAsc,
  SortDesc,
  BookOpen,
  DollarSign,
  TrendingUp,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { urlFor } from '@/utils/imageUrlBuilder';

interface Book {
  _id: string;
  title: string;
  author: string;
  price: number;
  quantity: number;
  selectedCondition: string;
  status: 'published' | 'draft' | 'sold_out' | 'hidden';
  _createdAt: string;
  _updatedAt: string;
  photos: Array<{
    _key?: string;
    asset?: {
      _ref?: string;
      url?: string;
    };
  }>;
  selectedCategory?: {
    _id: string;
    title: string;
  };
  views?: number;
  sales?: number;
}

interface BookStats {
  totalBooks: number;
  publishedBooks: number;
  draftBooks: number;
  totalViews: number;
  totalSales: number;
  totalRevenue: number;
}

export default function MyBooksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<BookStats>({
    totalBooks: 0,
    publishedBooks: 0,
    draftBooks: 0,
    totalViews: 0,
    totalSales: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchBooks();
  }, [session, status, router]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/my-books');
      if (!response.ok) throw new Error('Failed to fetch books');

      const data = await response.json();
      setBooks(data.books || []);
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your books',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (book: Book) => {
    try {
      const response = await fetch(`/api/my-books/${book._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete book');

      toast({
        title: 'Success',
        description: 'Book deleted successfully',
      });

      fetchBooks(); // Refresh the list
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete book',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedBooks.length === 0) return;

    try {
      const response = await fetch('/api/my-books/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookIds: selectedBooks,
          action,
        }),
      });

      if (!response.ok) throw new Error('Failed to perform bulk action');

      toast({
        title: 'Success',
        description: `${selectedBooks.length} books updated successfully`,
      });

      setSelectedBooks([]);
      fetchBooks();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (bookId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/my-books/${bookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: 'Success',
        description: 'Book status updated successfully',
      });

      fetchBooks();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update book status',
        variant: 'destructive',
      });
    }
  };

  // Filter and sort books
  const filteredBooks = books
    .filter(book => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || book.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'created':
          comparison =
            new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime();
          break;
        case 'updated':
          comparison =
            new Date(a._updatedAt).getTime() - new Date(b._updatedAt).getTime();
          break;
        case 'views':
          comparison = (a.views || 0) - (b.views || 0);
          break;
        case 'sales':
          comparison = (a.sales || 0) - (b.sales || 0);
          break;
        default:
          comparison =
            new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      published: {
        label: 'Published',
        variant: 'default' as const,
        color: 'bg-green-100 text-green-800',
      },
      draft: {
        label: 'Draft',
        variant: 'secondary' as const,
        color: 'bg-gray-100 text-gray-800',
      },
      sold_out: {
        label: 'Sold Out',
        variant: 'destructive' as const,
        color: 'bg-red-100 text-red-800',
      },
      hidden: {
        label: 'Hidden',
        variant: 'outline' as const,
        color: 'bg-yellow-100 text-yellow-800',
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getConditionBadge = (condition: string) => {
    const conditionConfig = {
      new: { label: 'New', color: 'bg-blue-100 text-blue-800' },
      'like-new': { label: 'Like New', color: 'bg-green-100 text-green-800' },
      good: { label: 'Good', color: 'bg-yellow-100 text-yellow-800' },
      fair: { label: 'Fair', color: 'bg-orange-100 text-orange-800' },
      poor: { label: 'Poor', color: 'bg-red-100 text-red-800' },
    };

    const config =
      conditionConfig[condition as keyof typeof conditionConfig] ||
      conditionConfig.good;

    return (
      <Badge variant='outline' className={config.color}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='container mx-auto space-y-6 py-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>My Books</h1>
          <p className='text-muted-foreground'>
            Manage your book listings and track their performance
          </p>
        </div>
        <Button onClick={() => router.push('/sell')}>
          <Plus className='h-4 w-4 mr-2' />
          Add New Book
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Books</CardTitle>
            <BookOpen className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalBooks}</div>
            <p className='text-xs text-muted-foreground'>
              {stats.publishedBooks} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Views</CardTitle>
            <Eye className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats.totalViews.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>All time views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Sales</CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalSales}</div>
            <p className='text-xs text-muted-foreground'>Books sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ${stats.totalRevenue.toFixed(2)}
            </div>
            <p className='text-xs text-muted-foreground'>Before fees</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div className='flex flex-1 gap-4'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  placeholder='Search books...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-9'
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-32'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='published'>Published</SelectItem>
                  <SelectItem value='draft'>Draft</SelectItem>
                  <SelectItem value='sold_out'>Sold Out</SelectItem>
                  <SelectItem value='hidden'>Hidden</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className='w-40'>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='newest'>Newest First</SelectItem>
                  <SelectItem value='title'>Title A-Z</SelectItem>
                  <SelectItem value='price'>Price</SelectItem>
                  <SelectItem value='views'>Views</SelectItem>
                  <SelectItem value='sales'>Sales</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant='outline'
                size='icon'
                onClick={() =>
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className='h-4 w-4' />
                ) : (
                  <SortDesc className='h-4 w-4' />
                )}
              </Button>
            </div>

            {selectedBooks.length > 0 && (
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleBulkAction('publish')}
                >
                  Publish ({selectedBooks.length})
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleBulkAction('hide')}
                >
                  Hide ({selectedBooks.length})
                </Button>
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={() => handleBulkAction('delete')}
                >
                  Delete ({selectedBooks.length})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Books Grid */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {filteredBooks.map(book => (
          <Card key={book._id} className='overflow-hidden'>
            <div className='aspect-square relative'>
              <Image
                src={
                  book.photos[0] ? urlFor(book.photos[0]) : '/islamiclibrary.jpg'
                }
                alt={book.title}
                fill
                className='object-cover'
              />
              <div className='absolute top-2 left-2 flex gap-2'>
                {getStatusBadge(book.status)}
                {getConditionBadge(book.selectedCondition)}
              </div>
              <div className='absolute top-2 right-2'>
                <input
                  type='checkbox'
                  checked={selectedBooks.includes(book._id)}
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedBooks([...selectedBooks, book._id]);
                    } else {
                      setSelectedBooks(
                        selectedBooks.filter(id => id !== book._id)
                      );
                    }
                  }}
                  className='h-4 w-4'
                />
              </div>
            </div>

            <CardContent className='p-4'>
              <div className='space-y-2'>
                <h3 className='font-semibold line-clamp-2'>{book.title}</h3>
                <p className='text-sm text-muted-foreground'>{book.author}</p>

                <div className='flex items-center justify-between'>
                  <span className='text-lg font-bold'>${book.price}</span>
                  <span className='text-sm text-muted-foreground'>
                    Qty: {book.quantity}
                  </span>
                </div>

                <div className='flex items-center justify-between text-sm text-muted-foreground'>
                  <span>{book.views || 0} views</span>
                  <span>{book.sales || 0} sales</span>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex gap-1'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => router.push(`/all?book=${book._id}`)}
                    >
                      <Eye className='h-3 w-3' />
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => router.push(`/all/${book._id}?edit=true`)}
                    >
                      <Edit className='h-3 w-3' />
                    </Button>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='sm'>
                        <MoreVertical className='h-3 w-3' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem
                        onClick={() =>
                          handleToggleStatus(
                            book._id,
                            book.status === 'published' ? 'hidden' : 'published'
                          )
                        }
                      >
                        {book.status === 'published' ? (
                          <>
                            <EyeOff className='h-4 w-4 mr-2' />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className='h-4 w-4 mr-2' />
                            Publish
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleToggleStatus(
                            book._id,
                            book.status === 'draft' ? 'published' : 'draft'
                          )
                        }
                      >
                        {book.status === 'draft' ? (
                          <>
                            <TrendingUp className='h-4 w-4 mr-2' />
                            Publish
                          </>
                        ) : (
                          <>
                            <Edit className='h-4 w-4 mr-2' />
                            Move to Draft
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className='text-destructive'
                        onClick={() => {
                          setBookToDelete(book);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className='h-4 w-4 mr-2' />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <BookOpen className='h-12 w-12 text-muted-foreground mb-4' />
            <h3 className='text-lg font-semibold mb-2'>No books found</h3>
            <p className='text-muted-foreground text-center mb-4'>
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : "You haven't listed any books yet"}
            </p>
            <Button onClick={() => router.push('/sell')}>
              <Plus className='h-4 w-4 mr-2' />
              Add Your First Book
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{bookToDelete?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (bookToDelete) {
                  handleDeleteBook(bookToDelete);
                  setDeleteDialogOpen(false);
                  setBookToDelete(null);
                }
              }}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

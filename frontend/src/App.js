import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const App = () => {
  const [month, setMonth] = useState(3); // Default to March
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({
    totalSaleAmount: 0,
    totalSoldItems: 0,
    totalNotSoldItems: 0
  });
  const [barChartData, setBarChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  useEffect(() => {
    let isMounted = true;

    const fetchTransactions = () => {
      return fetch(
        `http://localhost:5000/api/transactions?month=${month}&page=${page}&search=${searchText}`
      ).then(response => response.json());
    };

    const fetchStatistics = () => {
      return fetch(
        `http://localhost:5000/api/statistics?month=${month}`
      ).then(response => response.json());
    };

    const fetchBarChart = () => {
      return fetch(
        `http://localhost:5000/api/bar-chart?month=${month}`
      ).then(response => response.json());
    };

    setLoading(true);
    setError(null);

    Promise.all([
      fetchTransactions(),
      fetchStatistics(),
      fetchBarChart()
    ])
      .then(([transactionsData, statisticsData, barChartData]) => {
        if (isMounted) {
          console.log('Statistics Data:', statisticsData); // Debug log
          setTransactions(transactionsData.transactions || []);
          setStatistics({
            totalSaleAmount: Number(statisticsData.totalAmount || 0),
            // Check for both possible property names
            totalSoldItems: Number(statisticsData.soldItems || statisticsData.totalSoldItems || 0),
            totalNotSoldItems: Number(statisticsData.notSoldItems || statisticsData.totalNotSoldItems || 0)
          });
          setBarChartData(barChartData || []);
        }
      })
      .catch(error => {
        if (isMounted) {
          console.error('Error fetching data:', error);
          setError(error.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [month, page, searchText]);

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#ffc0cb',
      minHeight: '100vh'
    }}>
      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        <select 
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value))}
          style={{ 
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search transactions..."
          style={{ 
            flex: 1,
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        />
      </div>

      {/* Statistics */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h3>Total Sale Amount</h3>
          <p style={{ fontSize: '24px', margin: '10px 0 0 0' }}>
            ${statistics.totalSaleAmount.toFixed(2)}
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h3>Total Sold Items</h3>
          <p style={{ fontSize: '24px', margin: '10px 0 0 0' }}>
            {statistics.totalSoldItems}
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h3>Total Not Sold Items</h3>
          <p style={{ fontSize: '24px', margin: '10px 0 0 0' }}>
            {statistics.totalNotSoldItems}
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{ 
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginBottom: '20px' }}>Price Range Distribution</h3>
        <div style={{ height: '400px' }}>
          <ResponsiveContainer>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions Table */}
      <div style={{ 
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginBottom: '20px' }}>Transactions</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr>
                <th style={{ 
                  textAlign: 'left',
                  padding: '12px 8px',
                  borderBottom: '1px solid #ddd'
                }}>Title</th>
                <th style={{ 
                  textAlign: 'left',
                  padding: '12px 8px',
                  borderBottom: '1px solid #ddd'
                }}>Description</th>
                <th style={{ 
                  textAlign: 'right',
                  padding: '12px 8px',
                  borderBottom: '1px solid #ddd'
                }}>Price</th>
                <th style={{ 
                  textAlign: 'center',
                  padding: '12px 8px',
                  borderBottom: '1px solid #ddd'
                }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(transactions) && transactions.length > 0 ? (
                transactions.map((transaction, index) => (
                  <tr key={index}>
                    <td style={{ 
                      padding: '12px 8px',
                      borderBottom: '1px solid #eee'
                    }}>{transaction.title}</td>
                    <td style={{ 
                      padding: '12px 8px',
                      borderBottom: '1px solid #eee'
                    }}>{transaction.description}</td>
                    <td style={{ 
                      textAlign: 'right',
                      padding: '12px 8px',
                      borderBottom: '1px solid #eee'
                    }}>${transaction.price?.toFixed(2) || '0.00'}</td>
                    <td style={{ 
                      textAlign: 'center',
                      padding: '12px 8px',
                      borderBottom: '1px solid #eee'
                    }}>{transaction.sold ? 'Sold' : 'Not Sold'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                    {loading ? 'Loading transactions...' : 'No transactions found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px'
        }}>
          <button
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            style={{ 
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            onClick={() => setPage(prev => prev + 1)}
            disabled={transactions.length < 10}
            style={{ 
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
import React from 'react';

const SummaryCards = ({ budgets, bills }) => {
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.budgeted, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const overdueBills = bills.filter(bill => bill.status === 'overdue');

  const cards = [
    {
      title: 'Total Budget',
      value: `$${totalBudget.toLocaleString()}`,
      icon: 'bi-piggy-bank',
      color: 'success',
      bgColor: 'bg-success-subtle'
    },
    {
      title: 'Total Spent',
      value: `$${totalSpent.toLocaleString()}`,
      icon: 'bi-credit-card',
      color: 'primary',
      bgColor: 'bg-primary-subtle'
    },
    {
      title: 'Remaining Budget',
      value: `$${(totalBudget - totalSpent).toLocaleString()}`,
      icon: 'bi-wallet2',
      color: 'info',
      bgColor: 'bg-info-subtle'
    },
    {
      title: 'Overdue Bills',
      value: overdueBills.length,
      icon: 'bi-exclamation-triangle',
      color: 'danger',
      bgColor: 'bg-danger-subtle'
    }
  ];

  return (
    <div className="row">
      {cards.map((card, index) => (
        <div key={index} className="col-md-6 col-xl-3 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center">
              <div className={`rounded-circle p-3 me-3 ${card.bgColor}`}>
                <i className={`${card.icon} text-${card.color} fs-4`}></i>
              </div>
              <div>
                <h6 className="card-subtitle mb-1 text-muted">{card.title}</h6>
                <h4 className={`card-title mb-0 fw-bold text-${card.color}`}>
                  {card.value}
                </h4>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
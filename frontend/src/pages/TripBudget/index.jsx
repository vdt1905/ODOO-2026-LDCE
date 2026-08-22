import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Coins,
  MapPinned,
  Moon,
  Pencil,
  PiggyBank,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';

import { tripApi } from '../../api/trip.api.js';
import { cn } from '../../lib/cn.js';
import { BANNERS, BUDGET_CATEGORIES, ROUTES } from '../../lib/constants.js';
import { formatCurrency, formatNumber, pluralise } from '../../lib/format.js';
import { useAsync } from '../../hooks/useAsync.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { Alert, Button, EmptyState } from '../../components/ui/index.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { CategoryDonut } from './CategoryDonut.jsx';
import { DailySpendChart } from './DailySpendChart.jsx';
import { StopTable } from './StopTable.jsx';

const Stat = ({ icon: Icon, label, value, sub, tone = 'default' }) => {
  const ember = tone === 'ember';

  return (
    <div
      className={cn(
        'rounded-3xl border p-4 sm:p-5',
        ember ? 'border-ember-100 bg-ember-50' : 'border-line bg-surface'
      )}
    >
      <p
        className={cn(
          'flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase',
          ember ? 'text-ember-700' : 'text-ink-500'
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {label}
      </p>
      <p
        className={cn(
          'mt-2 truncate font-display text-2xl',
          ember ? 'text-ember-700' : 'text-ink-900'
        )}
      >
        {value}
      </p>
      {sub && (
        <p className={cn('mt-0.5 truncate text-xs', ember ? 'text-ember-700' : 'text-ink-500')}>
          {sub}
        </p>
      )}
    </div>
  );
};

const Card = ({ title, description, children, className }) => (
  <section className={cn('rounded-3xl border border-line bg-surface p-5 sm:p-6', className)}>
    <h2 className="font-display text-xl text-ink-900">{title}</h2>
    {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
    <div className="mt-5">{children}</div>
  </section>
);

/**
 * Budget breakdown for one trip.
 *
 * Every number on this screen is computed by budget.service.js — nothing is
 * added up here, which is why the donut, the bars and the table can never
 * disagree with each other or with the builder's running total.
 */
const TripBudgetPage = () => {
  const { id } = useParams();

  const { data, loading, error } = useAsync(
    () =>
      Promise.all([
        tripApi.budget(id),
        // Only the name is wanted, for the crumbs and the kicker. A failure
        // here must not cost the page the numbers the user came for.
        tripApi.byId(id).then(
          (trip) => trip,
          () => null
        ),
      ]).then(([budget, trip]) => ({ budget, trip })),
    [id]
  );

  const budget = data?.budget;
  const trip = data?.trip;

  usePageTitle(trip ? `Budget · ${trip.name}` : 'Budget');

  const currency = budget?.currency;

  // The server guards with `trip.budgetLimit ? … : null`, so a limit of 0 comes
  // back as budgetLimit: 0 alongside a null allowance and null remaining.
  // Treating any falsy limit as "no limit" keeps the progress bar out of a
  // division by zero and matches what the server actually decided.
  const hasLimit = Boolean(budget?.budgetLimit) && budget?.remaining !== null;
  const usedPercent = hasLimit ? (budget.total / budget.budgetLimit) * 100 : 0;
  const overBudget = Boolean(budget?.isOverBudget);

  const overDays = budget?.overBudgetDays?.length ?? 0;
  const worst = budget?.mostExpensiveStop ?? null;

  return (
    <>
      <PageHeader
        image={BANNERS.budget}
        kicker={trip?.name || 'Trip budget'}
        title="Budget"
        sub="Where the money goes — by category, by city and day by day."
        breadcrumb={[
          { label: 'My trips', to: ROUTES.trips },
          { label: trip?.name || 'Trip', to: ROUTES.trip(id) },
          { label: 'Budget' },
        ]}
        actions={
          <>
            <Button
              to={ROUTES.trip(id)}
              variant="light"
              leftIcon={<ArrowLeft className="size-4" />}
            >
              Back to itinerary
            </Button>
            <Button
              to={ROUTES.tripBuilder(id)}
              variant="glass"
              leftIcon={<Pencil className="size-4" />}
            >
              Edit stops
            </Button>
          </>
        }
      />

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        {error && (
          <Alert tone="error" title="This budget could not be loaded">
            {error.message}
          </Alert>
        )}

        <section aria-label="Budget summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-30 animate-pulse rounded-3xl bg-canvas-deep" />
            ))
          ) : !budget ? null : (
            <>
              <Stat
                icon={Coins}
                label="Planned spend"
                value={formatCurrency(budget.total, currency)}
                sub={`across ${pluralise(budget.tripDays, 'day')}`}
              />
              <Stat
                icon={TrendingUp}
                label="Average per day"
                value={formatCurrency(budget.avgPerDay, currency)}
                sub={
                  budget.dailyAllowance !== null
                    ? `allowance ${formatCurrency(budget.dailyAllowance, currency)}`
                    : 'no daily allowance'
                }
              />
              {hasLimit ? (
                <Stat
                  icon={PiggyBank}
                  tone={overBudget ? 'ember' : 'default'}
                  label={overBudget ? 'Over budget' : 'Remaining'}
                  value={formatCurrency(Math.abs(budget.remaining), currency)}
                  sub={`of ${formatCurrency(budget.budgetLimit, currency)}`}
                />
              ) : (
                <div className="rounded-3xl border border-dashed border-line bg-surface p-4 sm:p-5">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase text-ink-500">
                    <PiggyBank className="size-3.5" aria-hidden />
                    Remaining
                  </p>
                  <p className="mt-2 truncate font-display text-2xl text-ink-500">No limit set</p>
                  <Link
                    to={ROUTES.tripBuilder(id)}
                    className="mt-0.5 inline-block text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    Set a budget
                  </Link>
                </div>
              )}
              <Stat
                icon={CalendarDays}
                label="Trip length"
                value={formatNumber(budget.tripDays)}
                sub={pluralise(budget.tripNights, 'night')}
              />
            </>
          )}
        </section>

        {!loading && budget && (
          hasLimit ? (
            <section
              className={cn(
                'rounded-3xl border p-5 sm:p-6',
                overBudget ? 'border-ember-100 bg-ember-50' : 'border-line bg-surface'
              )}
            >
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                <div className="min-w-0">
                  <h2
                    className={cn(
                      'flex items-center gap-2 font-display text-xl',
                      overBudget ? 'text-ember-700' : 'text-ink-900'
                    )}
                  >
                    {overBudget && <TriangleAlert className="size-5" aria-hidden />}
                    Against your limit
                  </h2>
                  <p
                    className={cn(
                      'mt-1 text-sm',
                      overBudget ? 'text-ember-700' : 'text-ink-500'
                    )}
                  >
                    {overBudget
                      ? `${formatCurrency(Math.abs(budget.remaining), currency)} over the ${formatCurrency(budget.budgetLimit, currency)} you set.`
                      : `${formatCurrency(budget.remaining, currency)} still to spend of ${formatCurrency(budget.budgetLimit, currency)}.`}
                  </p>
                </div>

                <p
                  className={cn(
                    'font-display text-2xl tabular-nums',
                    overBudget ? 'text-ember-700' : 'text-ink-900'
                  )}
                >
                  {Math.round(usedPercent)}%
                </p>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-canvas-deep">
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-500',
                    overBudget ? 'bg-ember-500' : 'bg-brand-500'
                  )}
                  // A sliver at 0% still reads as a bar rather than an empty tube.
                  style={{ width: `${Math.min(100, Math.max(usedPercent, 2))}%` }}
                />
              </div>

              {budget.dailyAllowance !== null && (
                <p
                  className={cn('mt-3 text-xs', overBudget ? 'text-ember-700' : 'text-ink-500')}
                >
                  {formatCurrency(budget.dailyAllowance, currency)} a day across{' '}
                  {pluralise(budget.tripDays, 'day')} — you are averaging{' '}
                  {formatCurrency(budget.avgPerDay, currency)}.
                </p>
              )}
            </section>
          ) : (
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-dashed border-line bg-surface p-5 sm:p-6">
              <div className="min-w-0">
                <h2 className="font-display text-xl text-ink-900">No limit set</h2>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-500">
                  Give the trip a budget and every day that blows past its share of it gets
                  flagged, here and in the builder.
                </p>
              </div>
              <Button to={ROUTES.tripBuilder(id)} variant="outline">
                Set a budget
              </Button>
            </section>
          )
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {loading ? (
            <>
              <div className="h-72 animate-pulse rounded-3xl bg-canvas-deep" />
              <div className="h-72 animate-pulse rounded-3xl bg-canvas-deep" />
            </>
          ) : !budget ? null : (
            <>
              <Card title="By category" description="Every cost on the trip, split four ways.">
                <CategoryDonut
                  byCategory={budget.byCategory}
                  total={budget.total}
                  currency={currency}
                />
              </Card>

              <Card title="Worth knowing" description="The headlines behind the numbers.">
                <dl className="space-y-3.5">
                  <div className="flex items-start justify-between gap-4 border-b border-line-soft pb-3.5">
                    <dt className="flex items-center gap-2 text-sm text-ink-700">
                      <MapPinned className="size-4 text-ink-300" aria-hidden />
                      Priciest city
                    </dt>
                    <dd className="min-w-0 text-right">
                      {worst ? (
                        <>
                          <span className="block truncate font-medium text-ink-900">
                            {worst.city}
                          </span>
                          <span className="text-xs tabular-nums text-ink-500">
                            {formatCurrency(worst.total, currency)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-ink-500">No stops costed yet</span>
                      )}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-line-soft pb-3.5">
                    <dt className="flex items-center gap-2 text-sm text-ink-700">
                      <Moon className="size-4 text-ink-300" aria-hidden />
                      Nights away
                    </dt>
                    <dd className="font-medium tabular-nums text-ink-900">{budget.tripNights}</dd>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <dt className="flex items-center gap-2 text-sm text-ink-700">
                      <TriangleAlert
                        className={cn('size-4', overDays > 0 ? 'text-ember-500' : 'text-ink-300')}
                        aria-hidden
                      />
                      Days over the allowance
                    </dt>
                    <dd
                      className={cn(
                        'font-medium tabular-nums',
                        overDays > 0 ? 'text-ember-700' : 'text-ink-900'
                      )}
                    >
                      {budget.dailyAllowance === null ? '—' : overDays}
                    </dd>
                  </div>
                </dl>
              </Card>
            </>
          )}
        </div>

        {loading ? (
          <div className="h-80 animate-pulse rounded-3xl bg-canvas-deep" />
        ) : budget ? (
          <Card
            title="Day by day"
            description={
              budget.dailyAllowance === null
                ? 'What each day of the trip costs, stacked by category.'
                : overDays > 0
                  ? `${pluralise(overDays, 'day')} over the daily allowance of ${formatCurrency(budget.dailyAllowance, currency)}.`
                  : `Every day sits inside the daily allowance of ${formatCurrency(budget.dailyAllowance, currency)}.`
            }
          >
            <DailySpendChart
              dailySpend={budget.dailySpend}
              dailyAllowance={budget.dailyAllowance}
              currency={currency}
            />

            <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              {BUDGET_CATEGORIES.map((category) => (
                <li key={category.value} className="flex items-center gap-2 text-xs text-ink-700">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: category.color }}
                    aria-hidden
                  />
                  {category.label}
                </li>
              ))}
              {overDays > 0 && (
                <li className="flex items-center gap-2 text-xs text-ember-700">
                  <span className="size-2.5 rounded-full bg-ember-500" aria-hidden />
                  Over the allowance
                </li>
              )}
            </ul>
          </Card>
        ) : null}

        {loading ? (
          <div className="h-64 animate-pulse rounded-3xl bg-canvas-deep" />
        ) : budget ? (
          <Card title="By city" description="Transport, stay, meals and activities per stop.">
            {budget.byStop.length > 0 ? (
              <StopTable byStop={budget.byStop} currency={currency} />
            ) : (
              <EmptyState
                compact
                icon={MapPinned}
                title="No stops to cost yet"
                description="Add a city in the builder, give it a hotel and a meal budget, and it lands here."
                action={
                  <Button to={ROUTES.tripBuilder(id)} variant="outline">
                    Open the builder
                  </Button>
                }
              />
            )}
          </Card>
        ) : null}
      </div>
    </>
  );
};

export default TripBudgetPage;

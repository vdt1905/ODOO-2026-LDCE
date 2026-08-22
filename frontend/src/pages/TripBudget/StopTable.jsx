import { formatDateRange } from '../../lib/dates.js';
import { formatCurrency } from '../../lib/format.js';

const HEAD_CLASS =
  'px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide uppercase text-ink-500 whitespace-nowrap';

/**
 * Cost per city, category by category.
 *
 * `byStop[].activities` is that stop's activity *cost*, not a list — the same
 * key means a number here and an array on the itinerary payload.
 */
export const StopTable = ({ byStop = [], currency }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-xl border-collapse text-sm">
      <thead>
        <tr className="border-b border-line">
          <th scope="col" className={`${HEAD_CLASS} text-left`}>
            City
          </th>
          <th scope="col" className={`${HEAD_CLASS} text-left`}>
            Dates
          </th>
          <th scope="col" className={HEAD_CLASS}>
            Nights
          </th>
          <th scope="col" className={HEAD_CLASS}>
            Transport
          </th>
          <th scope="col" className={HEAD_CLASS}>
            Stay
          </th>
          <th scope="col" className={HEAD_CLASS}>
            Meals
          </th>
          <th scope="col" className={HEAD_CLASS}>
            Activities
          </th>
          <th scope="col" className={HEAD_CLASS}>
            Total
          </th>
        </tr>
      </thead>

      <tbody>
        {byStop.map((stop) => (
          <tr key={stop.stopId} className="border-b border-line-soft last:border-0">
            <th scope="row" className="px-3 py-3 text-left font-medium whitespace-nowrap text-ink-900">
              {stop.city}
              {stop.country && <span className="font-normal text-ink-500">, {stop.country}</span>}
            </th>
            <td className="px-3 py-3 whitespace-nowrap text-ink-500">
              {formatDateRange(stop.startDate, stop.endDate)}
            </td>
            <td className="px-3 py-3 text-right tabular-nums text-ink-700">{stop.nights}</td>
            <td className="px-3 py-3 text-right tabular-nums text-ink-700">
              {formatCurrency(stop.transport, currency)}
            </td>
            <td className="px-3 py-3 text-right tabular-nums text-ink-700">
              {formatCurrency(stop.stay, currency)}
            </td>
            <td className="px-3 py-3 text-right tabular-nums text-ink-700">
              {formatCurrency(stop.meals, currency)}
            </td>
            <td className="px-3 py-3 text-right tabular-nums text-ink-700">
              {formatCurrency(stop.activities, currency)}
            </td>
            <td className="px-3 py-3 text-right font-semibold tabular-nums text-ink-900">
              {formatCurrency(stop.total, currency)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

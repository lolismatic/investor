import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-root',
  template: `
    <div>
      <mat-form-field floatLabel="always">
        <mat-label>Capital initial</mat-label>
        <input
          name="initialCapital"
          type="number"
          [(ngModel)]="initalCapital"
          [min]="1"
          matInput
        />
        <mat-hint>Capitalul cu care se porneste investitia</mat-hint>
      </mat-form-field>
      <mat-form-field floatLabel="always">
        <mat-label>Contributie lunara</mat-label>
        <input
          name="monthlyContribution"
          type="number"
          [(ngModel)]="monthlyContribution"
          [min]="0"
          matInput
        />
        <mat-hint>Se aplica incepand cu a doua luna</mat-hint>
      </mat-form-field>
      <mat-form-field floatLabel="always">
        <mat-label>% Dobanda anuala</mat-label>
        <input
          name="annualInterestRate"
          type="number"
          [(ngModel)]="annualInterestRate"
          [min]="0"
          matInput
        />
        <mat-hint>Dobanda se aplica incepand cu prima luna</mat-hint>
      </mat-form-field>
      <mat-form-field floatLabel="always">
        <mat-label>Numar de ani</mat-label>
        <input
          name="nrOfYears"
          type="number"
          [(ngModel)]="nrOfYears"
          [min]="0"
          matInput
        />
        <mat-hint>Frecventa compuneri se face pe luna</mat-hint>
      </mat-form-field>
      <mat-form-field floatLabel="always">
        <mat-label>% Taxa de administrare anuala</mat-label>
        <input
          name="managementFee"
          type="number"
          [(ngModel)]="managementFee"
          [min]="0"
          matInput
        />
        <mat-hint>Taxa de administrare se aplica dupa dobanda. (ex: 0.08%/luna => 0.96%/an)</mat-hint>
      </mat-form-field>
    </div>
    <table>
      <thead>
        <tr>
          <th>Year</th>
          <th>Capital</th>
          <th>Interest</th>
          <th>Management fee</th>
          <th>Final Capital</th>
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.yearMonth) {
        <tr>
          <td>{{ row.yearMonth }}</td>
          <td>{{ row.capital }}</td>
          <td>{{ row.interest }}</td>
          <td>{{ row.managementFee }}</td>
          <td>{{ row.finalCapital }}</td>
        </tr>
        }
      </tbody>
      <tfoot>
        <tr>
          <td></td>
          <td>
            Total contributii<br />
            <b>{{ totalContributions() }}</b>
          </td>
          <td>
            <b>&sum;={{ totalInterest() }}</b>
          </td>
          <td>
            <b>&sum;={{ totalManagementFee() }}</b>
          </td>
          <td>
            Total profit<br />
            dupa impozit pe venit/%profit<br />
            <b>{{ finalProfitAfterTaxes() }}</b>/
            <b>{{ procentProfitAfterTaxes() }}</b>
          </td>
        </tr>
      </tfoot>
    </table>
  `,
  imports: [MatFormFieldModule, MatInputModule, FormsModule],
  styles: `
    :host {
      display: grid;
      grid-template-columns: 1fr 2fr;
      grid-gap: 1rem;
    }

    mat-form-field {
      width: 100%;
    }

    table {
      text-align: left;
      font-family: monospace;
      border: 1px solid rgba(0,0,0, 0.56);
      padding: 0.5rem;
    }

    tfoot {
      vertical-align: bottom;
    }

    tbody {
      tr:nth-child(12n) {
        font-weight: bold;
      }

      tr:nth-child(even) {
        background-color: rgba(0,0,0, 0.12);
      }
    }
  `,
})
export class AppComponent {
  readonly initalCapital = signal(1000);
  readonly monthlyContribution = signal(100);
  readonly annualInterestRate = signal(4.72);
  readonly nrOfYears = signal(1);
  readonly managementFee = signal(0.96);
  readonly rows = computed(() =>
    this.computeRows({
      initialCapital: this.initalCapital(),
      monthlyContribution: this.monthlyContribution(),
      annualInterestRate: this.annualInterestRate(),
      nrOfYears: this.nrOfYears(),
      managementFee: this.managementFee(),
    })
  );
  readonly totalInterest = computed(() => {
    const rows = this.rows();

    let total = 0;

    for (const row of rows) {
      total += parseFloat(row.interest);
    }

    return total.toFixed(2);
  });
  readonly totalManagementFee = computed(() => {
    const rows = this.rows();

    let total = 0;

    for (const row of rows) {
      total += parseFloat(row.managementFee);
    }

    return total.toFixed(2);
  });
  readonly totalContributions = computed(() => {
    return (
      this.nrOfYears() * 12 * this.monthlyContribution() + this.initalCapital()
    );
  });
  readonly finalProfitAfterTaxes = computed(() => {
    const rows = this.rows();

    return (
      (parseFloat(rows[rows.length - 1].finalCapital) -
        this.totalContributions()) *
      0.9
    ).toFixed(2);
  });

  readonly procentProfitAfterTaxes = computed(() => {
    const rows = this.rows();
    const profit = (parseFloat(rows[rows.length - 1].finalCapital) - this.totalContributions()) * 0.9;

    return ((profit / this.totalContributions()) * 100).toFixed(2);
  })

  computeRows(values: {
    initialCapital: number;
    monthlyContribution: number;
    annualInterestRate: number;
    nrOfYears: number;
    managementFee: number;
  }) {
    const {
      initialCapital: initialCapital,
      monthlyContribution,
      annualInterestRate,
      nrOfYears,
      managementFee: managementFeeValue,
    } = values;

    type MonthlyBreakdown = {
      year: number;
      month: number;
      capital: number;
      interest: number;
      managementFee: number;
      finalCapital: number;
    };

    const monthlyBreakdown: Array<Array<MonthlyBreakdown>> = [];
    let lastMonthOfPreviousYear: MonthlyBreakdown | null = null;

    for (let year = 0; year < nrOfYears; year++) {
      const monthlyBreakdownYear: Array<MonthlyBreakdown> = [];

      for (let month = 0; month < 12; month++) {
        const previousMonth = monthlyBreakdownYear[month - 1] ??
          lastMonthOfPreviousYear ?? {
            finalCapital: initialCapital,
            contributions: 0,
            capital: 0,
            interest: 0,
            managementFee: 0,
            month: -1,
            year: -1,
          };

        const capital = previousMonth.finalCapital;
        const interest = (capital * annualInterestRate) / 12 / 100;
        const managementFee = (capital * managementFeeValue) / 12 / 100;

        monthlyBreakdownYear.push({
          year,
          month,
          capital,
          interest,
          managementFee,
          finalCapital:
            capital + interest + monthlyContribution - managementFee,
        });
      }

      monthlyBreakdown.push(monthlyBreakdownYear);
      lastMonthOfPreviousYear =
        monthlyBreakdownYear[monthlyBreakdownYear.length - 1];
    }

    const rows = monthlyBreakdown.flatMap((byMonth) =>
      byMonth.map(
        ({ finalCapital, capital, interest, managementFee, month, year }) => ({
          yearMonth: `${year + 1}/${month + 1}`,
          capital: capital.toFixed(2),
          interest: interest.toFixed(2),
          managementFee: managementFee.toFixed(2),
          finalCapital: finalCapital.toFixed(2),
        })
      )
    );

    return rows;
  }
}

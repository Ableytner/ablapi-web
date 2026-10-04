import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { WillhabenService } from '../../core/api/willhaben.service';
import { WillhabenConfigDto, CreateWillhabenConfigDto } from '../../core/models/willhaben.model';

@Component({
  selector: 'app-willhaben',
  imports: [FormsModule, NgFor, NgIf],
  template: `
    <div class="willhaben-page">
      <div class="page-header">
        <h1>Willhaben</h1>
        <button class="btn-primary" (click)="showCreateForm = !showCreateForm">
          {{ showCreateForm ? 'Cancel' : '+ New Config' }}
        </button>
      </div>

      <!-- Create/Edit Form -->
      <div *ngIf="showCreateForm" class="config-form">
        <h2>{{ editingName ? 'Edit Config' : 'New Config' }}</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>Name *</label>
            <input [(ngModel)]="form.name" name="name" placeholder="Unique config name" [disabled]="!!editingName" />
          </div>
          <div class="form-group">
            <label>Keyword *</label>
            <input [(ngModel)]="form.keyword" name="keyword" placeholder="Search keyword" />
          </div>
          <div class="form-group">
            <label>Category</label>
            <input type="number" [(ngModel)]="form.category" name="category" />
          </div>
          <div class="form-group">
            <label>Rows</label>
            <input type="number" [(ngModel)]="form.rows" name="rows" />
          </div>
          <div class="form-group">
            <label>Price Min</label>
            <input type="number" [(ngModel)]="form.price_min" name="price_min" />
          </div>
          <div class="form-group">
            <label>Price Max</label>
            <input type="number" [(ngModel)]="form.price_max" name="price_max" />
          </div>
          <div class="form-group">
            <label>KM Max</label>
            <input type="number" [(ngModel)]="form.km_max" name="km_max" />
          </div>
          <div class="form-group">
            <label>Max Distance (km)</label>
            <input type="number" [(ngModel)]="form.max_distance_km" name="max_distance_km" />
          </div>
          <div class="form-group">
            <label>Ref Latitude</label>
            <input type="number" step="any" [(ngModel)]="form.reference_lat" name="reference_lat" />
          </div>
          <div class="form-group">
            <label>Ref Longitude</label>
            <input type="number" step="any" [(ngModel)]="form.reference_lon" name="reference_lon" />
          </div>
          <div class="form-group">
            <label>Handover Types (comma-separated)</label>
            <input [(ngModel)]="form.handover_types_raw" name="handover_types" placeholder="e.g. Abholung, Lieferung" />
          </div>
          <div class="form-group">
            <label>Allowed States (comma-separated)</label>
            <input [(ngModel)]="form.allowed_states_raw" name="allowed_states" placeholder="e.g. Wien, Niederösterreich" />
          </div>
          <div class="form-group">
            <label>Must Include (comma-separated)</label>
            <input [(ngModel)]="form.must_include_raw" name="must_include" placeholder="e.g. Automatik, Klima" />
          </div>
          <div class="form-group">
            <label>Must Exclude (comma-separated)</label>
            <input [(ngModel)]="form.must_exclude_raw" name="must_exclude" placeholder="e.g. Unfall, Wasser" />
          </div>
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" [(ngModel)]="form.filter_paylivery" name="filter_paylivery" />
              Filter Paylivery
            </label>
          </div>
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" [(ngModel)]="form.sort_by_distance" name="sort_by_distance" />
              Sort by Distance
            </label>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-primary" (click)="saveConfig()" [disabled]="saving">
            {{ saving ? 'Saving...' : (editingName ? 'Update' : 'Create') }}
          </button>
        </div>
      </div>

      <!-- Config List -->
      <div *ngIf="!showCreateForm">
        <div *ngIf="configsLoading" class="loading">Loading configs...</div>
        <div *ngIf="configsError" class="error">{{ configsError }}</div>

        <div class="config-list" *ngIf="configs.length > 0">
          <div class="config-item" *ngFor="let config of configs">
            <div class="config-info">
              <h3>{{ config.name }}</h3>
              <p><strong>Keyword:</strong> {{ config.keyword }}</p>
              <p><strong>Price Range:</strong> {{ config.price_min }} - {{ config.price_max }}</p>
              <p *ngIf="config.allowed_states.length"><strong>States:</strong> {{ config.allowed_states.join(', ') }}</p>
            </div>
            <div class="config-actions">
              <button class="btn-secondary" (click)="editConfig(config)">Edit</button>
              <button class="btn-danger" (click)="deleteConfig(config.name)">Delete</button>
            </div>
          </div>
        </div>

        <p *ngIf="!configsLoading && configs.length === 0" class="empty-state">
          No configurations found. Create one to get started.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .willhaben-page {
      max-width: 900px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 2rem;
      color: #1a1a2e;
      margin: 0;
    }

    .btn-primary {
      padding: 0.6rem 1.2rem;
      background: #1a1a2e;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 500;
    }

    .btn-primary:hover:not(:disabled) {
      background: #16213e;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      padding: 0.4rem 0.8rem;
      background: #f0f0f0;
      color: #333;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
    }

    .btn-secondary:hover {
      background: #e0e0e0;
    }

    .btn-danger {
      padding: 0.4rem 0.8rem;
      background: #fff;
      color: #c00;
      border: 1px solid #fcc;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
    }

    .btn-danger:hover {
      background: #fee;
    }

    .config-form {
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .config-form h2 {
      margin: 0 0 1.5rem;
      font-size: 1.25rem;
      color: #1a1a2e;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-group label {
      font-size: 0.85rem;
      font-weight: 500;
      color: #555;
    }

    .form-group input[type="text"],
    .form-group input[type="number"] {
      padding: 0.5rem 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.9rem;
      appearance: textfield;
      -webkit-appearance: none;
    }

    .form-group input[type="number"]::-webkit-inner-spin-button,
    .form-group input[type="number"]::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .form-group input:focus {
      outline: none;
      border-color: #4a90d9;
    }

    .form-group input:disabled {
      background: #f5f5f5;
    }

    .checkbox-group label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 400;
      cursor: pointer;
    }

    .form-actions {
      margin-top: 1.5rem;
    }

    .loading {
      color: #666;
      padding: 2rem 0;
      text-align: center;
    }

    .error {
      color: #c00;
      background: #fee;
      padding: 0.75rem 1rem;
      border-radius: 6px;
      border: 1px solid #fcc;
      margin-bottom: 1rem;
    }

    .config-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .config-item {
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      padding: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .config-info h3 {
      margin: 0 0 0.5rem;
      color: #1a1a2e;
    }

    .config-info p {
      margin: 0.25rem 0;
      color: #666;
      font-size: 0.9rem;
    }

    .config-actions {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .empty-state {
      color: #666;
      text-align: center;
      padding: 3rem 0;
    }
  `],
})
export class WillhabenComponent implements OnInit {
  private willhabenService = inject(WillhabenService);

  configs: WillhabenConfigDto[] = [];
  configsLoading = false;
  configsError = '';

  showCreateForm = false;
  editingName: string | null = null;
  saving = false;

  form: CreateWillhabenConfigDto = {
    name: '',
    keyword: '',
    category: 0,
    rows: 100,
    price_min: 0,
    price_max: 0,
    filter_paylivery: false,
    handover_types: [],
    allowed_states: [],
    km_max: 0,
    must_include: [],
    must_exclude: [],
    sort_by_distance: false,
    reference_lat: 0,
    reference_lon: 0,
    max_distance_km: 0,
    handover_types_raw: '',
    allowed_states_raw: '',
    must_include_raw: '',
    must_exclude_raw: '',
  };

  ngOnInit(): void {
    this.loadConfigs();
  }

  loadConfigs(): void {
    this.configsLoading = true;
    this.configsError = '';
    this.willhabenService.getConfigs().subscribe({
      next: (data) => { this.configs = data; this.configsLoading = false; },
      error: () => { this.configsError = 'Failed to load configurations.'; this.configsLoading = false; },
    });
  }

  editConfig(config: WillhabenConfigDto): void {
    this.editingName = config.name;
    this.form = {
      name: config.name,
      keyword: config.keyword,
      category: config.category,
      rows: config.rows,
      price_min: config.price_min,
      price_max: config.price_max,
      filter_paylivery: config.filter_paylivery,
      handover_types: [...config.handover_types],
      handover_types_raw: config.handover_types.join(', '),
      allowed_states: [...config.allowed_states],
      allowed_states_raw: config.allowed_states.join(', '),
      km_max: config.km_max,
      must_include: [...config.must_include],
      must_include_raw: config.must_include.join(', '),
      must_exclude: [...config.must_exclude],
      must_exclude_raw: config.must_exclude.join(', '),
      sort_by_distance: config.sort_by_distance,
      reference_lat: config.reference_lat,
      reference_lon: config.reference_lon,
      max_distance_km: config.max_distance_km,
    };
    this.showCreateForm = true;
  }

  saveConfig(): void {
    if (!this.form.name || !this.form.keyword) {
      return;
    }
    this.saving = true;

    // Convert raw comma-separated strings to arrays
    const payload: CreateWillhabenConfigDto = {
      ...this.form,
      handover_types: this.parseCommaSeparated(this.form.handover_types_raw),
      allowed_states: this.parseCommaSeparated(this.form.allowed_states_raw),
      must_include: this.parseCommaSeparated(this.form.must_include_raw),
      must_exclude: this.parseCommaSeparated(this.form.must_exclude_raw),
    };
    delete payload.handover_types_raw;
    delete payload.allowed_states_raw;
    delete payload.must_include_raw;
    delete payload.must_exclude_raw;

    const save$ = this.editingName
      ? this.willhabenService.updateConfig(this.editingName, payload)
      : this.willhabenService.createConfig(payload);

    save$.subscribe({
      next: () => {
        this.showCreateForm = false;
        this.editingName = null;
        this.resetForm();
        this.loadConfigs();
      },
      error: () => {
        this.saving = false;
      },
      complete: () => {
        this.saving = false;
      },
    });
  }

  private parseCommaSeparated(raw?: string): string[] {
    if (!raw || !raw.trim()) return [];
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }

  deleteConfig(name: string): void {
    if (!confirm(`Delete config "${name}"?`)) return;
    this.willhabenService.deleteConfig(name).subscribe({
      next: () => this.loadConfigs(),
      error: () => alert('Failed to delete config.'),
    });
  }

  resetForm(): void {
    this.form = {
      name: '',
      keyword: '',
      category: 0,
      rows: 100,
      price_min: 0,
      price_max: 0,
      filter_paylivery: false,
      handover_types: [],
      allowed_states: [],
      km_max: 0,
      must_include: [],
      must_exclude: [],
      sort_by_distance: false,
      reference_lat: 0,
      reference_lon: 0,
      max_distance_km: 0,
      handover_types_raw: '',
      allowed_states_raw: '',
      must_include_raw: '',
      must_exclude_raw: '',
    };
  }
}

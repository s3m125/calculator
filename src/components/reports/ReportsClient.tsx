"use client";

import { ExportButton } from "@/components/ExportButton";
import type { AssetListRow } from "@/lib/supabase/types";
import { FileSpreadsheet } from "lucide-react";

interface Props {
  assets: AssetListRow[];
  assignments: Record<string, unknown>[];
  transfers: Record<string, unknown>[];
  maintenance: Record<string, unknown>[];
  depreciation: Record<string, unknown>[];
  disposals: Record<string, unknown>[];
  audits: Record<string, unknown>[];
}

export function ReportsClient(props: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card
        title="Asset Register"
        count={props.assets.length}
        description="Every asset with category, location, status & value."
      >
        <ExportButton
          rows={props.assets as unknown as Record<string, unknown>[]}
          filename="asset_register"
          fields={[
            ["asset_id", "Asset ID"],
            ["name", "Name"],
            ["category_name", "Category"],
            ["brand", "Brand"],
            ["model", "Model"],
            ["serial_number", "Serial #"],
            ["status", "Status"],
            ["condition", "Condition"],
            ["location_name", "Location"],
            ["department_name", "Department"],
            ["project_name", "Project"],
            ["assigned_to_name", "Assigned To"],
            ["purchase_date", "Purchase Date"],
            ["purchase_price", "Purchase Price"],
            ["book_value", "Book Value"],
            ["warranty_end", "Warranty End"],
          ]}
        />
      </Card>

      <Card title="Assignments" count={props.assignments.length} description="Who is using what, when it's due, what's overdue.">
        <ExportButton
          rows={props.assignments}
          filename="assignments"
          fields={[
            ["assets_asset_id", "Asset ID"],
            ["assets_name", "Asset"],
            ["user_full_name", "Assigned To"],
            ["project_name", "Project"],
            ["assigned_date", "Assigned Date"],
            ["due_date", "Due Date"],
            ["returned_date", "Returned Date"],
            ["status", "Status"],
            ["notes", "Notes"],
          ]}
        />
      </Card>

      <Card title="Transfers" count={props.transfers.length} description="Asset movement history across locations & projects.">
        <ExportButton
          rows={props.transfers}
          filename="transfers"
          fields={[
            ["assets_asset_id", "Asset ID"],
            ["assets_name", "Asset"],
            ["from_name", "From"],
            ["to_name", "To"],
            ["transfer_date", "Date"],
            ["reason", "Reason"],
            ["status", "Status"],
          ]}
        />
      </Card>

      <Card title="Maintenance" count={props.maintenance.length} description="Preventive & corrective maintenance, cost, vendor.">
        <ExportButton
          rows={props.maintenance}
          filename="maintenance"
          fields={[
            ["assets_asset_id", "Asset ID"],
            ["assets_name", "Asset"],
            ["maintenance_type", "Type"],
            ["description", "Description"],
            ["schedule_date", "Scheduled"],
            ["completed_date", "Completed"],
            ["cost", "Cost"],
            ["vendor_name", "Vendor"],
            ["status", "Status"],
          ]}
        />
      </Card>

      <Card title="Depreciation" count={props.depreciation.length} description="Monthly depreciation, accumulated, book value.">
        <ExportButton
          rows={props.depreciation}
          filename="depreciation"
          fields={[
            ["assets_asset_id", "Asset ID"],
            ["assets_name", "Asset"],
            ["period", "Period"],
            ["monthly_depreciation", "Monthly"],
            ["accumulated_depreciation", "Accumulated"],
            ["book_value", "Book Value"],
          ]}
        />
      </Card>

      <Card title="Disposals" count={props.disposals.length} description="Asset write-off, sold, scrap.">
        <ExportButton
          rows={props.disposals}
          filename="disposals"
          fields={[
            ["assets_asset_id", "Asset ID"],
            ["assets_name", "Asset"],
            ["reason", "Reason"],
            ["disposal_date", "Disposal Date"],
            ["disposal_value", "Value"],
            ["buyer_name", "Buyer"],
            ["status", "Status"],
          ]}
        />
      </Card>

      <Card title="Audit Summary" count={props.audits.length} description="All audit sessions with variance counts.">
        <ExportButton
          rows={props.audits}
          filename="audit_summary"
          fields={[
            ["audit_code", "Audit Code"],
            ["title", "Title"],
            ["scheduled_date", "Scheduled"],
            ["completed_at", "Completed"],
            ["status", "Status"],
            ["total_expected", "Expected"],
            ["total_found", "Found"],
            ["total_not_found", "Not Found"],
            ["total_different_location", "Different Location"],
            ["total_damaged", "Damaged"],
          ]}
        />
      </Card>
    </div>
  );
}

function Card({
  title,
  count,
  description,
  children,
}: {
  title: string;
  count: number;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-slate-500">{count.toLocaleString()} record{count === 1 ? "" : "s"}</p>
        </div>
      </div>
      <p className="text-sm text-slate-600 mt-3">{description}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

"""Build one QR and invitation folder per guest from the Christian/Sephora workbook."""

from __future__ import annotations

import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path
from urllib.parse import quote

import openpyxl


ROOT = Path(__file__).resolve().parents[1]
WORKBOOK = ROOT.parent / "INVITES MARIAGE RELIGIEUX CHRISTIAN NEW.xlsx"
EVENT_ROOT = ROOT / "public" / "couple-christian-sephora"
TEMPLATE = EVENT_ROOT / "Table Clou de girofle" / "couple-palama"
PUBLIC_ROOT = "https://hope-events.vercel.app"
EVENT = {
    "id": "christian-sephora-palama-2026",
    "slug": "christian-sephora-palama-2026",
    "accessKey": "HE-CSM-2026",
    "coupleNames": "Christian Lengbe et Sephora Malanda",
    "dateIso": "2026-09-12T19:00:00+01:00",
    "dateLabel": "Samedi 12 septembre 2026",
    "timeLabel": "Benediction 11h00 - Soiree 19h00",
    "venueName": "N°31, avenue Macampagne,",
    "venueAddress": "Commune de Ngaliema - Ref. : arret Auado, coin Bocage",
    "mapUrl": "https://maps.google.com/?q=Avenue+Macampagne+31+Ngaliema+Kinshasa",
    "eventPhrase": "Une belle histoire se poursuit, soyez a nos cotes pour ecrire avec nous le prochain chapitre de notre amour.",
    "preferences": {
        "beers": ["Heineken", "Likofi", "Castel", "Tembo", "Beaufort", "Primus", "Turbo King", "Nkoyi Grand", "33 Export", "Savanna", "Bavaria"],
        "wine": ["Vin rouge", "Champagne", "Whisky"],
        "soft": ["Coca-Cola", "Fanta", "Sprite", "Vital'O", "Maltina", "Énergie Malt", "XXL", "Top", "Eau"],
    },
}


def text(value: object) -> str:
    return str(value or "").strip()


def slug(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = "".join(char for char in normalized if not unicodedata.combining(char))
    cleaned = re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")
    return cleaned or "invite"


def canonical_table(value: str) -> str:
    aliases = {"clou de giroffle": "Table Clou de girofle"}
    return aliases.get(value.lower(), value)


def table_token_slug(table_name: str) -> str:
    if table_name == "Table Clou de girofle":
        return "clou-de-girofle"
    return slug(table_name)


def usable_guest(value: object) -> bool:
    candidate = text(value)
    return bool(candidate) and not candidate.isdigit() and candidate.upper() not in {"TOTAL", "TABLES", "SEPHORA"}


def table_columns(sheet: openpyxl.worksheet.worksheet.Worksheet) -> dict[int, str]:
    if sheet.title == "Christian":
        header_row = next(
            row
            for row in range(1, sheet.max_row + 1)
            if text(sheet.cell(row, 1).value).lower() == "tables"
        )
        start_column = 2
    else:
        title_row = next(
            row
            for row in range(1, sheet.max_row + 1)
            if text(sheet.cell(row, 2).value).upper() == "SEPHORA"
        )
        header_row = title_row
        start_column = 3

    columns = {}
    duplicate_names: defaultdict[str, int] = defaultdict(int)
    for column in range(start_column, sheet.max_column + 1):
        name = text(sheet.cell(header_row, column).value)
        if name:
            canonical_name = canonical_table(name)
            duplicate_names[canonical_name] += 1
            suffix = "" if duplicate_names[canonical_name] == 1 else f" {duplicate_names[canonical_name]}"
            columns[column] = f"{canonical_name}{suffix}"

    return columns


def extract_guests(workbook: openpyxl.Workbook) -> list[dict[str, str | int]]:
    records: list[dict[str, str | int]] = []

    for sheet in workbook.worksheets:
        columns = table_columns(sheet)
        if sheet.title == "Christian":
            first_guest_row = 4
        else:
            first_guest_row = next(
                row
                for row in range(1, sheet.max_row + 1)
                if text(sheet.cell(row, 2).value).upper() == "SEPHORA"
            ) + 1

        fallback_table = "Table a attribuer"
        used_slugs: defaultdict[str, int] = defaultdict(int)

        for column, table_name in columns.items():
            for row in range(first_guest_row, sheet.max_row + 1):
                guest_name = text(sheet.cell(row, column).value)
                if not usable_guest(guest_name):
                    continue
                base_slug = f"{table_token_slug(table_name)}-{slug(guest_name)}"
                used_slugs[base_slug] += 1
                suffix = "" if used_slugs[base_slug] == 1 else f"-{used_slugs[base_slug]}"
                records.append(
                    {
                        "token": f"{base_slug}{suffix}",
                        "guestName": guest_name,
                        "tableName": table_name,
                        "tableSlug": table_token_slug(table_name),
                        "folderSlug": f"{slug(guest_name)}{suffix}",
                    }
                )

        # The Sephora sheet has guests in P:R without a visible table label.
        if sheet.title == "Sephora":
            for column in range(16, sheet.max_column + 1):
                for row in range(first_guest_row, sheet.max_row + 1):
                    guest_name = text(sheet.cell(row, column).value)
                    if not usable_guest(guest_name):
                        continue
                    base_slug = f"{slug(fallback_table)}-{slug(guest_name)}"
                    used_slugs[base_slug] += 1
                    suffix = "" if used_slugs[base_slug] == 1 else f"-{used_slugs[base_slug]}"
                    records.append(
                        {
                            "token": f"{base_slug}{suffix}",
                            "guestName": guest_name,
                            "tableName": fallback_table,
                            "tableSlug": slug(fallback_table),
                            "folderSlug": f"{slug(guest_name)}{suffix}",
                        }
                    )

    return records


def public_paths(table_name: str, guest_slug: str) -> tuple[str, str]:
    table_path = quote(table_name, safe="")
    invitation = f"/couple-christian-sephora/{table_path}/{guest_slug}/invitation"
    qr = f"/couple-christian-sephora/{table_path}/{guest_slug}/qr-code-{guest_slug}"
    return invitation, qr


def write_guest_pages(guest: dict[str, str | int]) -> dict[str, str]:
    table_name = str(guest["tableName"])
    guest_name = str(guest["guestName"])
    token = str(guest["token"])
    guest_slug = str(guest.get("folderSlug") or slug(guest_name))
    folder = EVENT_ROOT / table_name / guest_slug
    folder.mkdir(parents=True, exist_ok=True)
    invitation_public_path, qr_public_path = public_paths(table_name, guest_slug)
    poster_filename = "Invitation_Couple_Palama_Table_Clou_de_girofle.png"
    poster_path = (
        f"./{poster_filename}"
        if token == "clou-de-girofle-couple-palama"
        else f"../../Table Clou de girofle/couple-palama/{poster_filename}"
    )

    replacements = [
        (
            "/couple-christian-sephora/Table%20Clou%20de%20girofle/couple-palama/invitation",
            invitation_public_path,
        ),
        (
            "/couple-christian-sephora/Table%20Clou%20de%20girofle/couple-palama/qr-code-couple-palama",
            qr_public_path,
        ),
        ("clou-de-girofle-couple-palama", token),
        ("Couple Palama", guest_name),
        ("Table Clou de girofle", table_name),
        ("couple-palama", guest_slug),
    ]

    for filename in ("invitation.html", "invitation.js", "style.css", "qr-code-couple-palama.html"):
        source = TEMPLATE / filename
        destination_name = filename.replace("couple-palama", guest_slug)
        destination = folder / destination_name
        if destination == source:
            continue
        content = source.read_text(encoding="utf-8")
        for before, after in replacements:
            content = content.replace(before, after)
        content = content.replace(
            "./Invitation_Couple_Palama_Table_Clou_de_girofle.png",
            poster_path,
        )
        destination.write_text(content, encoding="utf-8")

    return {
        "invitationPagePath": f"./{table_name}/{guest_slug}/invitation.html",
        "publicInvitationPath": invitation_public_path,
        "qrPagePath": f"./{table_name}/{guest_slug}/qr-code-{guest_slug}.html",
        "publicQrPagePath": qr_public_path,
    }


def write_guest_data(guests: list[dict[str, str | int]], routes: dict[str, dict[str, str]]) -> None:
    invitation_data = {}
    for guest in guests:
        token = str(guest["token"])
        invitation_data[token] = {
            **guest,
            "eventId": EVENT["id"],
            "salutation": f"Cher{'' if str(guest['guestName']).lower().startswith('couple') else 'e'} invite",
            "seats": 2 if str(guest["guestName"]).lower().startswith("couple") else 1,
            "personalMessage": "Christian et Sephora seront heureux de partager cette journee de benediction et de joie avec vous.",
        }

    output = f"""window.HopeEventsGuestDirectory = {json.dumps(routes, ensure_ascii=False, indent=2)};

(function () {{
  const base = window.HopeEventsDemo || {{}};
  const event = {json.dumps(EVENT, ensure_ascii=False, indent=2)};
  const invitations = {json.dumps(invitation_data, ensure_ascii=False, indent=2)};

  function matchesEvent(key) {{
    const normalized = String(key || \"\").trim().replace(/[\\s_]+/g, \"-\").toUpperCase();
    return normalized === event.accessKey || normalized === event.slug.toUpperCase();
  }}

  window.HopeEventsDemo = Object.assign({{}}, base, {{
    getInvitation: function (token) {{
      const invitation = invitations[token];
      return invitation ? Object.assign({{}}, event, invitation) : base.getInvitation(token);
    }},
    getEventSpace: function (key) {{
      if (!matchesEvent(key)) {{
        return base.getEventSpace(key);
      }}

      return {{
        id: event.id,
        slug: event.slug,
        accessKey: event.accessKey,
        coupleNames: event.coupleNames,
        dateLabel: event.dateLabel,
        venueName: event.venueName,
        venueAddress: event.venueAddress,
        mapUrl: event.mapUrl,
        invitations: Object.values(invitations).map(function (invitation) {{
          return {{
            token: invitation.token,
            guestName: invitation.guestName,
            tableName: invitation.tableName,
            tableSlug: invitation.tableSlug,
            qrPagePath: (window.HopeEventsGuestDirectory[invitation.token] || {{}}).qrPagePath || \"\",
            seats: invitation.seats,
            invitationUrl: (window.HopeEventsGuestDirectory[invitation.token] || {{}}).invitationPagePath || \"\"
          }};
        }})
      }};
    }}
  }});
}})();
"""
    (EVENT_ROOT / "guests-data.js").write_text(output, encoding="utf-8")


def main() -> None:
    workbook = openpyxl.load_workbook(WORKBOOK, data_only=True)
    guests = extract_guests(workbook)
    routes = {str(guest["token"]): write_guest_pages(guest) for guest in guests}
    write_guest_data(guests, routes)
    print(f"Generated {len(guests)} guest folders across {len(set(str(item['tableName']) for item in guests))} tables.")


if __name__ == "__main__":
    main()

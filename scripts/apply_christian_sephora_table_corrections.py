"""Apply the approved table corrections without changing unlisted tables."""

from __future__ import annotations

from collections import defaultdict
import json

from generate_christian_sephora_guests import (
    ROOT,
    previous_directory,
    slug,
    table_token_slug,
    write_guest_data,
    write_guest_pages,
)


CORRECTED_TABLES = {
    "Banane": [
        "Couple Makaku",
        "Couple Bintene Prince",
        "Couple Bintene Rodrigue",
        "Couple Bintene Patrick",
        "Couple Thierry Mbuluku",
    ],
    "Mangousta": [
        "Couple Kalongele Lutu",
        "Couple Mobali",
        "Couple Bintene Malachie",
        "Mr Général Kasongo",
        "Madame Marise",
        "Madame Sylvie Miya",
        "Bavan",
    ],
    "Moringa": [
        "Couple Mukuanga 1",
        "Couple Mukuanga 2",
        "Couple Mbuluku Miya",
        "Couple Luwakumu 1",
        "Couple Luwakumu 2",
        "Couple Honorable Ilunga",
        "Couple Spécial",
        "Mme Micheline",
        "Mme Hortence",
        "Ntambila",
        "Ipakala Paulin",
    ],
    "Raisin": [
        "Couple Butey",
        "Couple Mimbo Jacques",
        "Mr/Mme Billy",
        "Mme Marie",
        "Mr Guy",
        "Mr Abraham",
    ],
    "Pamplemousse": [
        "Couple Bubu",
        "Couple Musumadi",
        "Kalonzo",
        "Niembo",
        "Mr Arnold",
        "Mme Fallonne",
        "Mme Orline",
        "Mme Aurélie",
        "Diya",
        "Nkiwabonga",
    ],
    "Citron": [
        "Couple Dr Laurent",
        "Couple Dr Mbembi",
        "Mme Nadine",
        "Mme Denise",
        "Muzungu",
        "Ferdinand",
        "Mme Esther",
    ],
    "Table DOCG": [
        "Directeur Paypay",
        "Mme Eunice",
        "Mme Sarah",
        "Mme Maguy",
        "Mr Junior",
        "Mr Steve",
        "Mr Claude",
        "Mme Claudia",
        "Mme Clémence",
        "Mme Maria",
    ],
    "Safou": [
        "Couple Miya",
        "Couple Dianga",
        "Couple Kepandeko",
        "Mr Nathan",
        "Mme Jorbelle",
        "Mr Airways",
        "Mme Patricia",
    ],
    "Acacia": [
        "Mr Kabongo Ntumba",
        "Mr Kabamba Busenu",
        "Tshama",
        "Mbuyi",
        "Kabangu",
        "Mbalanga",
        "Kabangu",
        "Bukasa",
    ],
    "Cœur de Bœuf": [
        "Vanessa",
        "Aminata",
        "Cynthia",
        "Farana",
        "Joséphine",
        "Amifa",
        "Kim's",
        "Welbeck",
        "Olivier",
        "Junior",
        "Ornella",
        "Angossi",
        "Virginie",
        "Parfaite",
        "Amissi",
        "Boss",
    ],
    "Pomme Rouge": [
        "Joelle",
        "Simplice",
        "Chantal",
        "Esther",
        "Shekinah",
        "Séphora",
        "Nyclette",
        "Couple Mbelenge",
        "Couple Mundele",
        "Denise",
        "Robelline",
        "Grâce",
        "Mila",
    ],
}

# Two legacy display names contain typos/case differences but represent the
# tables the client asked to replace.
REPLACED_TABLE_NAMES = {
    "raisin": {"raisin", "raisn"},
    "pomme rouge": {"pomme rouge"},
    "moringa": {"moringa", "table 1"},
}


def table_is_replaced(table_name: str) -> bool:
    normalized = table_name.casefold()
    for requested_name in CORRECTED_TABLES:
        aliases = REPLACED_TABLE_NAMES.get(requested_name.casefold(), {requested_name.casefold()})
        if normalized in aliases:
            return True
    return False


def correction_records() -> list[dict[str, str]]:
    records = []
    for table_name, guests in CORRECTED_TABLES.items():
        counts: defaultdict[str, int] = defaultdict(int)
        for guest_name in guests:
            guest_slug = slug(guest_name)
            counts[guest_slug] += 1
            suffix = "" if counts[guest_slug] == 1 else f"-{counts[guest_slug]}"
            records.append(
                {
                    "token": f"{table_token_slug(table_name)}-{guest_slug}{suffix}",
                    "guestName": guest_name,
                    "tableName": table_name,
                    "tableSlug": table_token_slug(table_name),
                    "folderSlug": f"{guest_slug}{suffix}",
                }
            )
    return records


def main() -> None:
    previous = previous_directory()
    retained = []
    routes = {}

    for token, invitation in previous["invitations"].items():
        if table_is_replaced(str(invitation.get("tableName", ""))):
            continue
        retained.append(
            {
                "token": token,
                "guestName": invitation["guestName"],
                "tableName": invitation["tableName"],
                "tableSlug": invitation.get("tableSlug") or table_token_slug(invitation["tableName"]),
                "folderSlug": invitation.get("folderSlug") or slug(invitation["guestName"]),
            }
        )
        if token in previous["routes"]:
            routes[token] = previous["routes"][token]

    corrections = correction_records()
    retained_tokens = {guest["token"] for guest in retained}
    for guest in corrections:
        base_token = guest["token"]
        attempt = base_token
        suffix = 2
        while attempt in retained_tokens:
            attempt = f"{base_token}-{suffix}"
            suffix += 1
        guest["token"] = attempt
        retained_tokens.add(attempt)

    for guest in corrections:
        routes[guest["token"]] = write_guest_pages(guest)

    guests = retained + corrections
    write_guest_data(guests, routes)
    manifest = ROOT / "tmp" / "christian-sephora-corrected-tokens.json"
    manifest.parent.mkdir(parents=True, exist_ok=True)
    manifest.write_text(json.dumps([guest["token"] for guest in corrections]), encoding="utf-8")
    print(f"Applied {len(corrections)} corrected invitations; retained {len(retained)} unlisted invitations.")


if __name__ == "__main__":
    main()

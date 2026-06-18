import re

with open('idp_erp_supabase_schema.md', 'r') as f:
    content = f.read()

tables = re.findall(r'### `([^`]+)`\n.*?\n\| Column \| Type \| Notes \|\n\|---\|---\|---\|\n((?:\|.*?\n)+)', content, re.DOTALL)

sql = "-- Auto-generated SQL schema from idp_erp_supabase_schema.md\n\n"
sql += 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n'

for table_name, columns_str in tables:
    sql += f'CREATE TABLE public.{table_name} (\n'
    cols = []
    lines = columns_str.strip().split('\n')
    for line in lines:
        parts = [p.strip() for p in line.split('|')[1:-1]]
        if len(parts) >= 2:
            col_name = parts[0].replace('`', '')
            col_type = parts[1].replace('`', '')
            
            # Map types
            if 'uuid PK' in col_type:
                col_def = f'{col_name} UUID PRIMARY KEY DEFAULT uuid_generate_v4()'
            elif 'uuid FK' in col_type:
                match = re.search(r'FK → `([^`]+)\.([^`]+)`', col_type)
                if match:
                    fk_table, fk_col = match.groups()
                    col_def = f'{col_name} UUID REFERENCES public.{fk_table}({fk_col}) ON DELETE CASCADE'
                else:
                    col_def = f'{col_name} UUID'
            elif col_type.startswith('enum'):
                col_def = f'{col_name} VARCHAR(50)'
            elif 'timestamptz' in col_type:
                col_def = f'{col_name} TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
            elif 'UNIQUE' in col_type:
                base_type = col_type.replace('UNIQUE', '').strip()
                col_def = f'{col_name} {base_type} UNIQUE'
            else:
                col_def = f'{col_name} {col_type.upper()}'
                
            # Handle default value in Notes if applicable (simplistic check)
            if len(parts) >= 3 and 'Default' in parts[2]:
                match = re.search(r'Default `([^`]+)`', parts[2])
                if match:
                    default_val = match.group(1)
                    if 'now()' in default_val:
                         col_def += ' DEFAULT NOW()'
                    elif default_val in ['true', 'false']:
                         col_def += f' DEFAULT {default_val.upper()}'
                    else:
                         col_def += f" DEFAULT '{default_val}'"
                         
            cols.append('  ' + col_def)
    
    sql += ',\n'.join(cols) + '\n);\n\n'

sql += "-- Initial Seed Data\n"
sql += "INSERT INTO public.schools (id, name, code, is_active) VALUES\n"
sql += "  (uuid_generate_v4(), 'IDPS Cherukupalli', 'IDPS-CHER', true),\n"
sql += "  (uuid_generate_v4(), 'IDPS Kalaburagi', 'IDPS-KALA', true);\n"

with open('schema.sql', 'w') as f:
    f.write(sql)
print("schema.sql generated successfully!")

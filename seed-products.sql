-- Seed inventory from Veritas_Inventory_Merged.xlsx
-- Uses normalized categories (looked up by name)
DO $$
DECLARE
  v_user_id UUID;
  v_cat_backup UUID;
  v_cat_system UUID;
  v_cat_networking UUID;
  v_cat_datacenter UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE username = 'manash';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User manash not found. Run schema first.';
  END IF;

  SELECT id INTO v_cat_backup FROM categories WHERE name = 'Backup';
  SELECT id INTO v_cat_system FROM categories WHERE name = 'System';
  SELECT id INTO v_cat_networking FROM categories WHERE name = 'Networking';
  SELECT id INTO v_cat_datacenter FROM categories WHERE name = 'Data Center';

  INSERT INTO products (product_description, part_number, category_id, quantity, inventory_box_serial, created_by)
    VALUES ('NetBackup Appliance 5340 — 4TB 5U84 BOD CRU Storage Disk Drive',         'HDD-VES-BODX-4TB',      v_cat_backup,      8, 'BOX-A-001', v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, inventory_box_serial, created_by)
    VALUES ('NetBackup Appliance 5340 — 8TB 5U84 BOD CRU Storage Disk Drive',         'HDD-VES-BODX-8TB',      v_cat_backup,      2, 'BOX-A-002', v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, inventory_box_serial, created_by)
    VALUES ('8TB Disk Drive in Carrier',                                                'HDD-VES-BODX2-8TB',    v_cat_datacenter,  2, 'BOX-B-001', v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, inventory_box_serial, created_by)
    VALUES ('5U DDIC, 8TB, 7K, 12G, N-SAS, 512e, Veritas PK',                         'PFRUKTXDXE001-01',     v_cat_datacenter,  2, 'BOX-B-002', v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, inventory_box_serial, created_by)
    VALUES ('NetBackup Appliance 5340 — 2TB 3.5" HDD CRU Drive Carrier/Sled',          'HDD-VES-NBU-2TB',      v_cat_backup,      3, 'BOX-A-003', v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, inventory_box_serial, created_by)
    VALUES ('Veritas 12G HDD Carrier W8TB 3.5" Disk Drive FRU',                        'HDD-VES-4TB-FRU',      v_cat_datacenter,  1, 'BOX-B-003', v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, inventory_box_serial, created_by)
    VALUES ('SSD FRU, 1.92TB, NVMe U.3, PCI-E X4',                                     'SSD-VES-CYP-2TB',      v_cat_datacenter,  1, 'BOX-B-004', v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, inventory_box_serial, created_by)
    VALUES ('Spare SSD, Intel S4510, 1.92TB, 3D2 TLC NAND, 6G SATA 2.5"',             'SSD-VES-5350-2TB',     v_cat_backup,      1, 'BOX-A-004', v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, inventory_box_serial, created_by)
    VALUES ('Spare SSD, Smart Modular N200, 32GB, 6G SATA, M.2 2280, 3D TLC',          'SSD-VES-FLEX-32GB',   v_cat_system,      1, 'BOX-C-001', v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('SP-PCM02-HE580-AC-FRU-VER (HDD Unit)',                                     '1019434-03',          v_cat_datacenter,  2, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('Nonproduct Specific 5350 — 64GB DDR4 3200 FRU Memory',                    'MEM-VES-5350-64GB',    v_cat_backup,      1, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('HBA FRU, QLE2772-SR-SP, 32GFC, SR Optic, Dual Port SFP+, PCI-E X8 4.0 LP','SBF-VES-32GFC-HBA',    v_cat_datacenter,  2, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('NetBackup Appliance 5340 — QLogic QLE2692 16GB FC CRU Dual Port',          'CTL-VES-NBU-2FC-16GB', v_cat_backup,     1, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('NetBackup Appliance X340 — Ethernet NIC Quad Port 4 1GB Mezzanine HW',     'CTL-VES-NBU5340-OCP', v_cat_backup,     1, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('Intel RAID Controller RSP3GD016J, 16PT, PCI-E X8 GEN3, SAS3416 LP',       'CTL-VES-ACC340-RAID', v_cat_datacenter, 1, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('NetBackup Appliance 5340 — Internal RMS3HC080 Mezzanine RAID Module',       'CTL-VES-NBU5340-RAID',v_cat_backup,     1, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('NetBackup Appliance 5340 — 5U84 EBOD I/O Storage 12G CRU Standard',        'CTL-VES-RAID-EBODX',  v_cat_backup,     1, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('NX3 SAS RBOD-5005 — Controller with SAS to Host (SAS) CRU',               'CTL-VES-RAID-RBODA',  v_cat_backup,     1, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('NetBackup Appliance 5340 — RBOD 16GB FC SFP Module CRU Standard',          'SBF-VES-BODX-16GSFP', v_cat_backup,     1, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('NetBackup Appliance 5340 — SFP Module for QLogic 2692 16GB FC CRU 2-Port', 'SBF-VES-NBU-QLSFP',   v_cat_backup,     1, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('Flex Appliance 5X50 — 10/25GB Ethernet PCI-E 3.0 Dual Port UPG',           'SBF-VES-FLEX-25GBETH',v_cat_system,     1, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('10GB SFP Short Range 300M Optical Module FRU',                             'SBF-G-SYM-NBU2-10GSFP-F', v_cat_datacenter, 1, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('PSU, 2.2KW, 12V, AC, PLAT, VERITAS',                                      '1106022-01 / PWR-VES-ECO-BODX', v_cat_backup, 2, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('PSU, 2.2KW, 12V, AC, VERITAS',                                             'PFRUKE20-01',        v_cat_datacenter,  1, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('NetBackup Appliance — 1100W PSU (100–240 VAC 50-60Hz)',                   'PWR-VES-NBU-PSU',     v_cat_backup,      1, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('Appliance C13 to C14 650mm Power Cable',                                   'SBF-G-SYM-PWR-4F',   v_cat_datacenter,  1, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('Cable Pkg, HDminiSAS – HDMiniSAS, 1.0m, VER',                             'PFRUKL26-01',        v_cat_datacenter,  1, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('NetBackup Appliance XX40 — 950mm INT SAS Cable HW Component',              'CBL-VES-NBU-MSAS',   v_cat_backup,      1, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('NetBackup Appliance 5340 — 5U84 CRU Storage System Fan Module',            'FAN-VES-BODX',       v_cat_backup,      1, v_user_id);
  INSERT INTO products (product_description, part_number, category_id, quantity, created_by)
    VALUES ('Seagate Exos 7E8 4TB SAS HDD',                                             'N/A',                v_cat_datacenter,  6, v_user_id);

  RAISE NOTICE 'Seeded 30 products with normalized categories.';
END;
$$;

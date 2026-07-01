# 🚀 Release Guide - ds-calendar

## Prerequisites (เตรียมก่อน)

### 1. NPM Account & Token
- ไปที่ https://www.npmjs.com/settings/~/tokens
- Create **Automation** token
- คัดลอก token

### 2. Set GitHub Secret
1. ไปที่ https://github.com/Windowsz/ds-calendar/settings/secrets/actions
2. คลิก **New repository secret**
3. ตั้งค่า:
   - **Name**: `NPM_TOKEN`
   - **Value**: วาง npm token ที่คัดลอกไว้
4. Click **Add secret**

---

## 📋 Release Steps

### Step 1: Create Workflow File
1. ไปที่ repository: https://github.com/Windowsz/ds-calendar
2. คลิก **Add file → Create new file**
3. ตั้งชื่อไฟล์: `.github/workflows/publish.yml`
4. วาง code ด้านล่าง
5. Commit to `main` branch

**File: `.github/workflows/publish.yml`**
```yaml
name: Publish ds-calendar

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build library
        run: npm run build:prod
      
      - name: Publish to npm
        run: npm publish dist/ds-calendar
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body: |
            ## ds-calendar ${{ github.ref_name }}
            
            This release is available on npm:
            ```
            npm install ds-calendar@${{ github.ref_name }}
            ```
          draft: false
          prerelease: false
```

---

### Step 2: Update Version in package.json
1. แก้ไข `projects/ngx-scheduler/package.json`
2. เปลี่ยน `"version"` เป็น release version ที่ต้องการ
   - เช่น: `"version": "1.0.0"`

```json
{
  "name": "ds-calendar",
  "version": "1.0.0",
  ...
}
```

---

### Step 3: Create Git Tag & Push
รันคำสั่งเหล่านี้ใน terminal:

```bash
# Checkout main branch
git checkout main

# Pull latest changes
git pull origin main

# Create tag (เปลี่ยน v1.0.0 เป็นเวอร์ชันที่ต้องการ)
git tag v1.0.0

# Push tag to GitHub
git push origin v1.0.0
```

---

### Step 4: Monitor Workflow
1. ไปที่ https://github.com/Windowsz/ds-calendar/actions
2. ดู workflow run "Publish ds-calendar"
3. รอให้ publish เสร็จ (ประมาณ 1-2 นาที)

---

## ✅ Verify Release

### Check GitHub Release
- ไปที่ https://github.com/Windowsz/ds-calendar/releases
- ควรเห็น release ที่สร้างขึ้น

### Check NPM Package
```bash
npm view ds-calendar
```

### Install Package
```bash
npm install ds-calendar@1.0.0
```

---

## 📝 Version Format

ใช้ Semantic Versioning:
- `v1.0.0` - Major release
- `v1.0.1` - Patch (bug fix)
- `v1.1.0` - Minor (new feature)
- `v2.0.0` - Breaking change

---

## 🔄 Release Version Table

| Version | Command | Notes |
|---------|---------|-------|
| v1.0.0 | `git tag v1.0.0` | First release |
| v1.0.1 | `git tag v1.0.1` | Bug fix |
| v1.1.0 | `git tag v1.1.0` | New feature |
| v2.0.0 | `git tag v2.0.0` | Breaking changes |

---

## ⚠️ Troubleshooting

### Token Error
- ตรวจสอบ `NPM_TOKEN` secret ถูกตั้งแล้ว
- ตรวจสอบ token ยังไม่หมดอายุ

### Build Failed
- รัน `npm ci` locally
- รัน `npm run build:prod` ให้สำเร็จ

### Publishing Failed
- ตรวจสอบ package name `ds-calendar` ไม่ชนกับ package อื่น
- ตรวจสอบ version ใน package.json ตรงกับ tag

---

**Happy Releasing! 🎉**

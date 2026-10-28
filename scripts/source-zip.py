from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1]
with zipfile.ZipFile(root/'dist/stargate-flight-source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted((root/'app').rglob('*')):
  if p.is_file(): z.write(p,p.relative_to(root/'app'))

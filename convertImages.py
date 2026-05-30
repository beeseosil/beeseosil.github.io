import os
import glob
from PIL import Image
import pillow_heif

pillow_heif.register_heif_opener()

def convertHeicToJpeg():
    fileList = glob.glob("*.[hH][eE][iI][cC]")
    for filePath in fileList:
        image = Image.open(filePath)
        outputPath = os.path.splitext(filePath)[0] + ".jpg"
        image.save(outputPath, "jpeg", quality=80)

if __name__ == "__main__":
    convertHeicToJpeg()
